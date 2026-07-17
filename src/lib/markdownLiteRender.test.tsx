import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { parseMarkdownLite } from './markdownLiteRender';

const ALLOWED_TAGS = new Set(['DIV', 'STRONG', 'EM', 'UL', 'LI', 'BR']);

function renderText(text: string) {
  return render(<div>{parseMarkdownLite(text)}</div>);
}

function assertOnlyWhitelistedTags(container: HTMLElement) {
  const all = container.querySelectorAll('*');
  all.forEach((el) => {
    expect(ALLOWED_TAGS.has(el.tagName)).toBe(true);
  });
}

describe('parseMarkdownLite — XSS safety', () => {
  it('renders a <script> tag as inert literal text, never as a real element', () => {
    const { container } = renderText('<script>alert(1)</script>');
    expect(container.querySelector('script')).toBeNull();
    expect(container.textContent).toBe('<script>alert(1)</script>');
    assertOnlyWhitelistedTags(container);
  });

  it('renders an <img onerror=...> payload as inert literal text', () => {
    const payload = '<img src=x onerror=alert(1)>';
    const { container } = renderText(payload);
    expect(container.querySelector('img')).toBeNull();
    expect(container.textContent).toBe(payload);
    assertOnlyWhitelistedTags(container);
  });

  it('renders javascript: URIs as plain text (no link syntax is supported at all)', () => {
    const { container } = renderText('click here: javascript:alert(1)');
    expect(container.querySelector('a')).toBeNull();
    expect(container.textContent).toContain('javascript:alert(1)');
  });

  it('renders raw HTML tags typed inside bold/italic markers as literal text within a real <strong>/<em>', () => {
    const { container } = renderText('**<b onmouseover=alert(1)>bold</b>**');
    const strong = container.querySelector('strong');
    expect(strong).not.toBeNull();
    expect(container.querySelector('b')).toBeNull();
    expect(strong?.textContent).toBe('<b onmouseover=alert(1)>bold</b>');
    assertOnlyWhitelistedTags(container);
  });

  it('renders an onerror payload inside a bullet list item as inert text within a real <li>', () => {
    const { container } = renderText('- <svg onload=alert(1)>');
    const li = container.querySelector('li');
    expect(li).not.toBeNull();
    expect(container.querySelector('svg')).toBeNull();
    expect(li?.textContent).toBe('<svg onload=alert(1)>');
    assertOnlyWhitelistedTags(container);
  });

  it('never produces attributes carrying event handlers or hrefs from user text', () => {
    const { container } = renderText('<a href="javascript:alert(1)" onclick="alert(2)">click</a>');
    assertOnlyWhitelistedTags(container);
    container.querySelectorAll('*').forEach((el) => {
      expect(el.getAttribute('onclick')).toBeNull();
      expect(el.getAttribute('href')).toBeNull();
    });
  });
});

describe('parseMarkdownLite — formatting behavior', () => {
  it('renders **bold** as a real <strong>', () => {
    const { container } = renderText('**important**');
    expect(container.querySelector('strong')?.textContent).toBe('important');
  });

  it('renders *italic* as a real <em>', () => {
    const { container } = renderText('*aside*');
    expect(container.querySelector('em')?.textContent).toBe('aside');
  });

  it('groups consecutive "- item" lines into one <ul> with one <li> each', () => {
    const { container } = renderText('- one\n- two\n- three');
    const uls = container.querySelectorAll('ul');
    expect(uls).toHaveLength(1);
    expect(container.querySelectorAll('li')).toHaveLength(3);
  });

  it('separates plain lines with <br>', () => {
    const { container } = renderText('line one\nline two');
    expect(container.querySelectorAll('br')).toHaveLength(1);
    expect(container.textContent).toBe('line oneline two');
  });

  it('starts a new list after non-list text interrupts it', () => {
    const { container } = renderText('- a\n- b\ntext\n- c');
    expect(container.querySelectorAll('ul')).toHaveLength(2);
  });
});
