export interface TextEdit {
  newValue: string;
  newStart: number;
  newEnd: number;
}

/** Wraps the selected range in `marker` on both sides (e.g. `**` for bold,
 * `*` for italic). If nothing is selected, inserts placeholder text between
 * the markers and selects it. Returns the new value plus where the
 * selection should land afterward. */
export function applyInlineWrap(
  value: string,
  start: number,
  end: number,
  marker: string,
): TextEdit {
  const before = value.slice(0, start);
  const after = value.slice(end);
  const hasSelection = end > start;
  const selected = hasSelection ? value.slice(start, end) : 'text';

  const newValue = `${before}${marker}${selected}${marker}${after}`;
  const newStart = start + marker.length;
  const newEnd = newStart + selected.length;

  return { newValue, newStart, newEnd };
}

/** Prefixes every line touched by the selection with "- " (skipping lines
 * already prefixed with "- " or "* "). */
export function applyBulletList(value: string, start: number, end: number): TextEdit {
  const lineStart = value.lastIndexOf('\n', start - 1) + 1;
  const nextBreak = value.indexOf('\n', end);
  const lineEnd = nextBreak === -1 ? value.length : nextBreak;

  const before = value.slice(0, lineStart);
  const after = value.slice(lineEnd);
  const block = value.slice(lineStart, lineEnd);

  const newBlock = block
    .split('\n')
    .map((line) => (/^[-*]\s/.test(line) ? line : `- ${line}`))
    .join('\n');

  return {
    newValue: before + newBlock + after,
    newStart: lineStart,
    newEnd: lineStart + newBlock.length,
  };
}
