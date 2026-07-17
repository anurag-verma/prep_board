import { parseMarkdownLite } from '../../lib/markdownLiteRender';

interface MarkdownLiteRendererProps {
  text: string;
  className?: string;
}

function MarkdownLiteRenderer({ text, className }: MarkdownLiteRendererProps) {
  return <div className={className}>{parseMarkdownLite(text)}</div>;
}

export default MarkdownLiteRenderer;
