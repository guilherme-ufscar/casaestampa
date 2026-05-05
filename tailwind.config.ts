import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
        poppins: ['Poppins', 'sans-serif'],
      },
      colors: {
        gold: {
          primary: '#C9A84C',
          light: '#E8C97A',
          dark: '#8B6914',
        },
        brand: {
          bg: '#FAFAFA',
          surface: '#FFFFFF',
          input: '#F7F4EF',
          border: '#F0EDE8',
          'border-input': '#E5E0D8',
        },
        text: {
          primary: '#1C1C1C',
          secondary: '#6B6B6B',
          muted: '#9A9A9A',
        },
      },
      boxShadow: {
        card: '0 2px 12px rgba(0,0,0,0.06)',
        'card-hover': '0 4px 20px rgba(0,0,0,0.10)',
        'gold-glow': '0 0 0 3px rgba(201,168,76,0.15)',
      },
    },
  },
  plugins: [],
};
export default config;
