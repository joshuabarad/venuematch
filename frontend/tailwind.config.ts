import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          purple: '#534AB7',
          'purple-lt': '#EEEDFE',
          teal: '#0F6E56',
          'teal-lt': '#E1F5EE',
          coral: '#993C1D',
          'coral-lt': '#FAECE7',
          amber: '#854F0B',
          'amber-lt': '#FAEEDA',
        },
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
      scale: { '98': '0.98' },
    },
  },
  plugins: [
    function ({
      addUtilities,
    }: {
      addUtilities: (utilities: Record<string, unknown>) => void;
    }) {
      addUtilities({
        '.scrollbar-hide': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
          '&::-webkit-scrollbar': { display: 'none' },
        },
        '.pb-safe': {
          'padding-bottom': 'max(1.5rem, env(safe-area-inset-bottom))',
        },
      });
    },
  ],
};

export default config;
