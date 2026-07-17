import { describe, expect, it } from 'vitest';
import { isSafeHttpUrl } from './url';

describe('isSafeHttpUrl', () => {
  it('accepts http and https URLs', () => {
    expect(isSafeHttpUrl('http://example.com/job/123')).toBe(true);
    expect(isSafeHttpUrl('https://example.com/job/123')).toBe(true);
  });

  it('rejects javascript: URIs', () => {
    expect(isSafeHttpUrl('javascript:alert(1)')).toBe(false);
  });

  it('rejects data: URIs', () => {
    expect(isSafeHttpUrl('data:text/html,<script>alert(1)</script>')).toBe(false);
  });

  it('rejects other schemes (mailto, ftp, file)', () => {
    expect(isSafeHttpUrl('mailto:someone@example.com')).toBe(false);
    expect(isSafeHttpUrl('ftp://example.com/file')).toBe(false);
    expect(isSafeHttpUrl('file:///etc/passwd')).toBe(false);
  });

  it('rejects empty and whitespace-only strings', () => {
    expect(isSafeHttpUrl('')).toBe(false);
    expect(isSafeHttpUrl('   ')).toBe(false);
  });

  it('rejects malformed / non-URL text', () => {
    expect(isSafeHttpUrl('not a url')).toBe(false);
    expect(isSafeHttpUrl('example.com')).toBe(false); // no scheme
  });

  it('rejects protocol-relative and bare scheme-less strings that could be mistaken for safe', () => {
    expect(isSafeHttpUrl('//example.com')).toBe(false);
  });
});
