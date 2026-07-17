import type { ReactNode } from 'react';

const INLINE_PATTERN = /\*\*(.+?)\*\*|\*(.+?)\*/g;

/** Parses **bold** and *italic* runs within a single line into React nodes.
 * Never touches the DOM as HTML — everything pushed here is either a plain
 * string (React escapes it automatically) or a <strong>/<em> element built
 * from that same escaped text, so arbitrary input can never inject markup. */
function parseInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;
  let match: RegExpExecArray | null;

  INLINE_PATTERN.lastIndex = 0;
  while ((match = INLINE_PATTERN.exec(text))) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    if (match[1] !== undefined) {
      nodes.push(<strong key={`${keyPrefix}-b-${key++}`}>{match[1]}</strong>);
    } else if (match[2] !== undefined) {
      nodes.push(<em key={`${keyPrefix}-i-${key++}`}>{match[2]}</em>);
    }
    lastIndex = INLINE_PATTERN.lastIndex;
  }
  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }
  return nodes;
}

const LIST_LINE = /^[-*]\s+(.+)$/;

/** Parses markdown-lite text into React nodes emitting only
 * <strong> <em> <ul> <li> <br> — the Security doc §4.1 whitelist. Consecutive
 * "- item" / "* item" lines group into one <ul>; everything else flows as
 * text separated by <br>. */
export function parseMarkdownLite(text: string): ReactNode[] {
  const lines = text.split('\n');
  const nodes: ReactNode[] = [];
  let listItems: string[] | null = null;
  let key = 0;

  function flushList() {
    if (!listItems) return;
    const items = listItems;
    nodes.push(
      <ul key={`ul-${key}`}>
        {items.map((item, i) => (
          <li key={`li-${key}-${i}`}>{parseInline(item, `li-${key}-${i}`)}</li>
        ))}
      </ul>,
    );
    key++;
    listItems = null;
  }

  lines.forEach((line, idx) => {
    const listMatch = LIST_LINE.exec(line);
    if (listMatch) {
      if (!listItems) listItems = [];
      listItems.push(listMatch[1]);
      return;
    }

    flushList();
    if (idx > 0) nodes.push(<br key={`br-${key++}`} />);
    nodes.push(...parseInline(line, `line-${key++}`));
  });
  flushList();

  return nodes;
}
