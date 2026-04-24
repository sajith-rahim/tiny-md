# tiny-md

A streaming markdown parser that just does the basics.

## How to install

This package isn't published to npm yet. For now, you can clone the repository from GitHub and install it locally using npm:

```bash
npm i .
```

## How to use

You can parse an entire string at once, or stream it in chunks. 

If you have the whole document ready to go:

```javascript
import { TinyMDParser, TinyMDRenderer } from 'tiny-md';

const tokens = TinyMDParser.parse('# Hello world\nThis is a test.');
const html = TinyMDRenderer.render(tokens);
document.body.innerHTML = html;
```

If you're streaming data from a network request or an AI response, feed it chunks as they arrive. You just need to tell the parser when it receives the final chunk so it can close out the last text block:

```javascript
import { TinyMDParser, TinyMDRenderer } from 'tiny-md';

const parser = new TinyMDParser();

// Feed chunks as you get them
const tokens1 = parser.parseChunk('# Streaming text\nSome chunk', false);
const html1 = TinyMDRenderer.render(tokens1);
// Append html1 to your DOM...

// Send the last chunk
const tokens2 = parser.parseChunk(' the end.', true);
const html2 = TinyMDRenderer.render(tokens2);
// Append html2 to your DOM...
```

## Tradeoffs

If you need 100% CommonMark compliance, you should probably use something like markdown-it or marked. 

`tiny-md` is intentionally limited. It supports the formatting most people actually use on a daily basis:
- Headings (levels 1-6)
- Paragraphs and blockquotes
- Unordered and ordered lists
- Code blocks and inline code
- Bold and italic text
- Links and images

It completely ignores tables, footnotes, raw HTML, reference links, and deeply nested lists. By dropping the edge cases, the parser stays tiny and fast enough to run in the browser without slowing down the main thread.

### Security

`tiny-md` does basic HTML escaping to catch stray `<script>` tags, but it doesn't strip malicious URLs (like `javascript:` links). 

If you are rendering user-generated content or LLM generated output, you should run the resulting HTML through a dedicated sanitizer like [DOMPurify](https://github.com/cure53/DOMPurify) before inserting it into the DOM.
