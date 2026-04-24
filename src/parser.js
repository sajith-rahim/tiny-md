export class TinyMDParser {
  constructor() {
    this.buffer = '';
    this.currentBlock = null;
  }

  // parses everything in one go
  static parse(markdown) {
    const parser = new TinyMDParser();
    return parser.parseChunk(markdown, true);
  }

  // takes a chunk of text and spits out finished blocks
  parseChunk(chunk, isLast = false) {
    this.buffer += chunk;
    const lines = this.buffer.split('\n');
    // hold onto the last line if we're not done, since it could be cut off
    const linesToProcess = isLast ? lines : lines.slice(0, -1);
    this.buffer = isLast ? '' : lines[lines.length - 1];

    let emittedTokens = [];

    for (let line of linesToProcess) {
      let tokens = this.processLine(line);
      if (tokens) emittedTokens.push(...tokens);
    }

    if (isLast && this.currentBlock) {
      emittedTokens.push(this.closeBlock());
    }

    // only run inline parsing on blocks we just finished
    return emittedTokens.map(block => this.parseInline(block));
  }

  processLine(line) {
    // code blocks
    if (this.currentBlock && this.currentBlock.type === 'code_block') {
      if (line.trim() === this.currentBlock.fence) {
        return [this.closeBlock()];
      } else {
        this.currentBlock.lines.push(line);
        return null;
      }
    }

    const codeMatch = line.match(/^(\s*)(`{3,}|~{3,})(.*)/);
    if (codeMatch) {
      let tokens = [];
      if (this.currentBlock) tokens.push(this.closeBlock());
      this.currentBlock = {
        type: 'code_block',
        fence: codeMatch[2],
        lang: codeMatch[3].trim(),
        lines: []
      };
      return tokens.length ? tokens : null;
    }

    // blank lines
    if (line.trim() === '') {
      if (this.currentBlock) {
        return [this.closeBlock()];
      }
      return null;
    }

    // headings
    const headingMatch = line.match(/^(#{1,6})\s+(.*)/);
    if (headingMatch) {
      let tokens = [];
      if (this.currentBlock) tokens.push(this.closeBlock());
      tokens.push({
        type: 'heading',
        depth: headingMatch[1].length,
        text: headingMatch[2]
      });
      return tokens;
    }

    // blockquotes
    const bqMatch = line.match(/^>\s?(.*)/);
    if (bqMatch) {
      if (!this.currentBlock || this.currentBlock.type !== 'blockquote') {
        let tokens = [];
        if (this.currentBlock) tokens.push(this.closeBlock());
        this.currentBlock = { type: 'blockquote', lines: [bqMatch[1]] };
        return tokens.length ? tokens : null;
      } else {
        this.currentBlock.lines.push(bqMatch[1]);
        return null;
      }
    }

    // lists
    const listMatch = line.match(/^([\*\-\+]|\d+\.)\s+(.*)/);
    if (listMatch) {
      const isOrdered = /\d+\./.test(listMatch[1]);
      if (!this.currentBlock || this.currentBlock.type !== 'list' || this.currentBlock.ordered !== isOrdered) {
        let tokens = [];
        if (this.currentBlock) tokens.push(this.closeBlock());
        this.currentBlock = { type: 'list', ordered: isOrdered, items: [listMatch[2]] };
        return tokens.length ? tokens : null;
      } else {
        this.currentBlock.items.push(listMatch[2]);
        return null;
      }
    }

    // paragraphs and continuations
    if (!this.currentBlock) {
      this.currentBlock = { type: 'paragraph', lines: [line] };
    } else if (this.currentBlock.type === 'paragraph') {
      this.currentBlock.lines.push(line);
    } else if (this.currentBlock.type === 'blockquote') {
      this.currentBlock.lines.push(line);
    } else if (this.currentBlock.type === 'list') {
      // tack this onto the last list item
      this.currentBlock.items[this.currentBlock.items.length - 1] += '\n' + line;
    }

    return null;
  }

  closeBlock() {
    const block = this.currentBlock;
    this.currentBlock = null;
    
    if (block.type === 'paragraph' || block.type === 'blockquote') {
      block.text = block.lines.join('\n');
      delete block.lines;
    } else if (block.type === 'code_block') {
      block.text = block.lines.join('\n');
      delete block.lines;
    }
    return block;
  }

  parseInline(block) {
    if (block.text !== undefined) {
      block.inlineTokens = this.tokenizeInline(block.text);
    }
    if (block.items) {
      block.parsedItems = block.items.map(item => this.tokenizeInline(item));
    }
    return block;
  }

  tokenizeInline(text) {
    const tokens = [];
    let current = 0;

    const rules = [
      { type: 'strong', regex: /^\*\*(.*?)\*\*/ },
      { type: 'strong', regex: /^__(.*?)__/ },
      { type: 'em', regex: /^\*(.*?)\*/ },
      { type: 'em', regex: /^_(.*?)_/ },
      { type: 'code', regex: /^`(.*?)`/ },
      { type: 'image', regex: /^!\[(.*?)\]\((.*?)\)/ },
      { type: 'link', regex: /^\[(.*?)\]\((.*?)\)/ }
    ];

    while (current < text.length) {
      let matched = false;
      
      for (const rule of rules) {
        const match = text.substring(current).match(rule.regex);
        if (match) {
          if (rule.type === 'link' || rule.type === 'image') {
            tokens.push({ type: rule.type, text: match[1], url: match[2] });
          } else {
            // handle strong/em recursively
            const nestedTokens = (rule.type === 'strong' || rule.type === 'em') 
              ? this.tokenizeInline(match[1]) 
              : [{ type: 'text', text: match[1] }];
            
            if (rule.type === 'code') {
               tokens.push({ type: rule.type, text: match[1] });
            } else {
               tokens.push({ type: rule.type, tokens: nestedTokens });
            }
          }
          current += match[0].length;
          matched = true;
          break;
        }
      }

      if (!matched) {
        const nextSpecial = text.substring(current).search(/[\*_\`\[\!]/);
        let textLen = nextSpecial > 0 ? nextSpecial : 1;
        
        const chunk = text.substring(current, current + textLen);
        const lastToken = tokens[tokens.length - 1];
        if (lastToken && lastToken.type === 'text') {
          lastToken.text += chunk;
        } else {
          tokens.push({ type: 'text', text: chunk });
        }
        current += textLen;
      }
    }
    return tokens;
  }
}
