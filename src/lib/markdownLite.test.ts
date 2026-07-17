import { describe, expect, it } from 'vitest';
import { applyBulletList, applyInlineWrap } from './markdownLite';

describe('applyInlineWrap', () => {
  it('wraps a selection with the marker', () => {
    const result = applyInlineWrap('hello world', 6, 11, '**');
    expect(result.newValue).toBe('hello **world**');
    expect(result.newStart).toBe(8);
    expect(result.newEnd).toBe(13);
  });

  it('inserts placeholder text and selects it when nothing is selected', () => {
    const result = applyInlineWrap('hello ', 6, 6, '*');
    expect(result.newValue).toBe('hello *text*');
    expect(result.newStart).toBe(7);
    expect(result.newEnd).toBe(11);
  });

  it('supports single-character italic markers alongside double-character bold', () => {
    const bold = applyInlineWrap('x', 0, 1, '**');
    expect(bold.newValue).toBe('**x**');
    const italic = applyInlineWrap('x', 0, 1, '*');
    expect(italic.newValue).toBe('*x*');
  });
});

describe('applyBulletList', () => {
  it('prefixes a single line with "- "', () => {
    const result = applyBulletList('todo item', 0, 9);
    expect(result.newValue).toBe('- todo item');
  });

  it('prefixes every line the selection touches', () => {
    const value = 'first\nsecond\nthird';
    const result = applyBulletList(value, 0, value.length);
    expect(result.newValue).toBe('- first\n- second\n- third');
  });

  it('does not double-prefix a line that already starts with "- " or "* "', () => {
    const value = '- already a bullet';
    const result = applyBulletList(value, 0, value.length);
    expect(result.newValue).toBe('- already a bullet');
  });

  it('only affects the lines the selection spans, leaving the rest untouched', () => {
    const value = 'keep me\nfirst\nsecond\nkeep me too';
    const start = value.indexOf('first');
    const end = value.indexOf('second') + 'second'.length;

    const result = applyBulletList(value, start, end);
    expect(result.newValue).toBe('keep me\n- first\n- second\nkeep me too');
  });
});
