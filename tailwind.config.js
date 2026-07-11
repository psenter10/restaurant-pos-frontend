/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#F7F5F0',
        ink: '#1A1A1A',
        'ink-soft': '#4A4744',
        line: '#DEDAD1',
        navy: {
          DEFAULT: '#2B3A55',
          light: '#3E5273',
        },
        sage: {
          DEFAULT: '#4B7B5B',
          light: '#E7EFE9',
        },
        amber: {
          DEFAULT: '#C98A2C',
          light: '#F6EBD8',
        },
        rust: {
          DEFAULT: '#B04632',
          light: '#F5E3DF',
        },
        sky: {
          DEFAULT: '#4A90C4',
          light: '#DCEBF7',
        },
        gold: {
          DEFAULT: '#D9B23C',
          light: '#FBF0C2',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      backgroundImage: {
        perf: 'radial-gradient(circle, #DEDAD1 1.5px, transparent 1.5px)',
      },
      backgroundSize: {
        perf: '10px 10px',
      },
    },
  },
  plugins: [],
};
