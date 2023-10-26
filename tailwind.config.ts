import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx}',
    './src/components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      backgroundImage: {
        'hero-pattern': "url('/assets/pattern-body.svg')",
        'main-pattern': "url('/assets/pattern-main.svg')",
      },
    },
  },
  plugins: [],
};

export default config;
