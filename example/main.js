import { TinyMDParser, TinyMDRenderer } from '../index.js';

const mdInput = document.getElementById('md-input');
const mdOutput = document.getElementById('md-output');
const btnBulk = document.getElementById('btn-bulk');
const btnStream = document.getElementById('btn-stream');

// starting text
const initialMD = `
# Welcome to TinyMD
A *simple* and **lightweight** streaming Markdown parser!

## Features
- Core CommonMark syntax
- Streaming capability (simulate network streams or LLM typing)
- Zero dependencies

### Code Example
\`\`\`javascript
const parser = new TinyMDParser();
const tokens = parser.parseChunk("# Hello Streaming", true);
console.log(tokens);
\`\`\`

> "It's not about passing 600 tests, it's about doing the core right."

Try modifying this text or running the stream simulation!
[Check out my code](https://github.com)
`;

mdInput.value = initialMD.trim();

// full parse helper
function performBulkParse() {
  const markdown = mdInput.value;
  const tokens = TinyMDParser.parse(markdown);
  const html = TinyMDRenderer.render(tokens);
  mdOutput.innerHTML = html;
}

// setup streaming simulation
let streamInterval = null;
function performStreamParse() {
  if (streamInterval) clearInterval(streamInterval);
  mdOutput.innerHTML = '<span class="streaming-cursor"></span>';

  const markdown = mdInput.value;
  const parser = new TinyMDParser();

  let i = 0;
  const chunkSize = 2; // chars per chunk (keeps it small to look like a stream)

  streamInterval = setInterval(() => {
    const chunk = markdown.substring(i, i + chunkSize);
    i += chunkSize;
    const isLast = i >= markdown.length;

    // parse the chunk
    const newTokens = parser.parseChunk(chunk, isLast);
    console.log(chunk);

    // if we got new tokens, render and append them
    if (newTokens.length > 0) {
      const htmlChunk = TinyMDRenderer.render(newTokens);
      // insert before the cursor
      const cursor = mdOutput.querySelector('.streaming-cursor');
      if (cursor) {
        cursor.insertAdjacentHTML('beforebegin', htmlChunk + '\n');
      } else {
        mdOutput.innerHTML += htmlChunk + '\n';
      }
      // auto-scroll to the bottom
      mdOutput.scrollTop = mdOutput.scrollHeight;
    }

    if (isLast) {
      clearInterval(streamInterval);
      const cursor = mdOutput.querySelector('.streaming-cursor');
      if (cursor) cursor.remove();
    }
  }, 10); // set to a fast typing speed
}

btnBulk.addEventListener('click', () => {
  btnBulk.classList.add('active');
  btnStream.classList.remove('active');
  performBulkParse();
});

btnStream.addEventListener('click', () => {
  btnStream.classList.add('active');
  btnBulk.classList.remove('active');
  performStreamParse();
});

// auto-parse on input if we're in bulk mode
mdInput.addEventListener('input', () => {
  if (btnBulk.classList.contains('active')) {
    performBulkParse();
  }
});

// kick off the first parse
performBulkParse();
