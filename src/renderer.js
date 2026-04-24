// quick helper to escape html characters
const escapeHTML = (str) => {
  if (!str) return '';
  return str.replace(/[&<>"']/g, match => {
    const escapeMap = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    };
    return escapeMap[match];
  });
};

export class TinyMDRenderer {
  static renderInlineTokens(tokens) {
    if (!tokens) return '';
    return tokens.map(token => {
      switch (token.type) {
        case 'text':
          return escapeHTML(token.text);
        case 'strong':
          return `<strong>${this.renderInlineTokens(token.tokens)}</strong>`;
        case 'em':
          return `<em>${this.renderInlineTokens(token.tokens)}</em>`;
        case 'code':
          return `<code>${escapeHTML(token.text)}</code>`;
        case 'link':
          return `<a href="${escapeHTML(token.url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(token.text)}</a>`;
        case 'image':
          return `<img src="${escapeHTML(token.url)}" alt="${escapeHTML(token.text)}" />`;
        default:
          return '';
      }
    }).join('');
  }

  static renderToken(block) {
    switch (block.type) {
      case 'heading':
        const h = `h${block.depth}`;
        return `<${h}>${this.renderInlineTokens(block.inlineTokens)}</${h}>`;
      
      case 'paragraph':
        return `<p>${this.renderInlineTokens(block.inlineTokens)}</p>`;
      
      case 'blockquote':
        return `<blockquote>${this.renderInlineTokens(block.inlineTokens)}</blockquote>`;
      
      case 'code_block':
        const langClass = block.lang ? ` class="language-${escapeHTML(block.lang)}"` : '';
        return `<pre><code${langClass}>${escapeHTML(block.text)}\n</code></pre>`;
        
      case 'list':
        const listTag = block.ordered ? 'ol' : 'ul';
        const items = block.parsedItems.map(itemTokens => 
          `<li>${this.renderInlineTokens(itemTokens)}</li>`
        ).join('');
        return `<${listTag}>\n${items}\n</${listTag}>`;
        
      default:
        return '';
    }
  }

  // turn a bunch of block tokens into an html string
  static render(tokens) {
    return tokens.map(token => this.renderToken(token)).join('\n');
  }
}
