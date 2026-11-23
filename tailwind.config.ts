import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
      colors: {
        ink: '#141416',
        text: '#2A2A30',
        soft: '#55555F',
        mute: '#77777F',
        line: '#E2E1DC',
        wline: '#DAD9D4',
        bg: '#FAFAF8',
        stage: '#EFEEEA',
        side: '#F7F6F2',
        titlebar: '#F4F3EF',
        rail: '#1F1F24',
        // Host chat app chrome (neutral navy, deliberately far from Relay magenta)
        chrome: '#1A2130',
        chrome2: '#222B3C',
        chromehover: '#2D384C',
        chrometext: '#E8EBF1',
        chromemute: '#A7B0BF',
        field: '#EDECE7',
        magenta: '#EE065E',
        // Same hue, a touch darker: white text on it passes WCAG AA (4.6:1 vs 4.35:1).
        magentafill: '#E6055B',
        mtext: '#D1004F',
        pink: '#FDEBF2',
        pinkline: '#F6B3CC',
        success: '#2FA36B',
        successbg: '#E7F5EE',
        successtext: '#1E7A4E',
        warn: '#B5561A',
        warnbg: '#FBEFE6',
      },
      borderRadius: {
        window: '14px',
        card: '12px',
        input: '8px',
      },
      boxShadow: {
        sm: '0 1px 2px rgba(20,20,22,.06), 0 4px 12px rgba(20,20,22,.06)',
        toast: '0 12px 32px rgba(20,20,22,.18)',
        window: '0 24px 60px rgba(20,20,22,.18)',
      },
      fontSize: {
        12: ['12px', '16px'],
        13: ['13px', '18px'],
        14: ['14px', '20px'],
        15: ['15px', '22px'],
        18: ['18px', '26px'],
        20: ['20px', '28px'],
      },
    },
  },
  plugins: [],
} satisfies Config;
