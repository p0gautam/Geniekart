import { Fragment } from 'react';

// Render the supplied policy's limited Markdown without accepting raw HTML.
function inline(text: string) {
  return text.split(/(\*\*[^*]+\*\*|https?:\/\/[^\s]+|[\w.+-]+@[\w.-]+\.[A-Za-z]{2,})/g).map((part, i) => {
    if (part.startsWith('**')) return <strong key={i}>{part.slice(2, -2)}</strong>;
    if (/^https?:\/\//.test(part)) return <a key={i} href={part}>{part}</a>;
    if (/^[\w.+-]+@/.test(part)) return <a key={i} href={`mailto:${part}`}>{part}</a>;
    return <Fragment key={i}>{part}</Fragment>;
  });
}

export function LegalContent({ text }: { text: string }) {
  return text.split(/\n\s*\n/).map((block, i) => {
    if (block.trim() === '---') return <hr key={i} />;
    // A bold subheading may immediately precede a list in the source.
    const lines = block.split('\n');
    const listStart = lines.findIndex((line) => line.startsWith('- '));
    if (listStart >= 0) return <Fragment key={i}>
      {listStart > 0 && <p>{inline(lines.slice(0, listStart).join(' '))}</p>}
      <ul>{lines.slice(listStart).map((line, j) => <li key={j}>{inline(line.replace(/^- /, ''))}</li>)}</ul>
    </Fragment>;
    return <p key={i}>{lines.map((line, j) => <Fragment key={j}>{j > 0 && <br />}{inline(line.trim())}</Fragment>)}</p>;
  });
}
