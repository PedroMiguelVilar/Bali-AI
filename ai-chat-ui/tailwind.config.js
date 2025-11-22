/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  theme: {
    extend: {
      borderRadius: {
        chat: '1.5rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'typing-dot-1': 'typingDot 1.4s infinite ease-in-out',
        'typing-dot-2': 'typingDot 1.4s infinite ease-in-out 0.2s',
        'typing-dot-3': 'typingDot 1.4s infinite ease-in-out 0.4s',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: 0, transform: 'translateY(10px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        typingDot: {
          '0%, 80%, 100%': { transform: 'translateY(0)', opacity: 0.6 },
          '40%': { transform: 'translateY(-6px)', opacity: 1 },
        },
      },
    },
  },
  plugins: [],
};
