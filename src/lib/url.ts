/** Only http/https URLs are safe to render as clickable links (Security doc §4.5).
 * Anything else — javascript:, data:, mailto:, malformed strings — is rejected. */
export function isSafeHttpUrl(value: string): boolean {
  if (!value.trim()) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}
