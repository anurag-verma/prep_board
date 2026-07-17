/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: 'var(--ink)',
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        line: 'var(--line)',
        muted: 'var(--muted)',
        action: 'var(--action)',
        'on-action': 'var(--on-action)',
        flag: 'var(--flag)',
        danger: 'var(--danger)',
        'on-danger': 'var(--on-danger)',
        win: 'var(--win)',
        stage: {
          wishlist: 'var(--stage-wishlist)',
          applied: 'var(--stage-applied)',
          oa: 'var(--stage-oa)',
          interviewing: 'var(--stage-interviewing)',
          offer: 'var(--stage-offer)',
          rejected: 'var(--stage-rejected)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        xs: '12px',
        sm: '13px',
        base: '15px',
        lg: '18px',
        xl: '22px',
        '2xl': '28px',
      },
      borderRadius: {
        card: '10px',
        column: '12px',
      },
    },
  },
  plugins: [],
};
