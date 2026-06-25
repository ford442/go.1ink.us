/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        scanline: "scanline 8s linear infinite",
        blob: "blob 7s infinite",
        "image-glitch": "image-glitch 2s infinite linear alternate-reverse",
        "particle-fly": "particle-fly 0.6s cubic-bezier(0.25, 1, 0.5, 1) forwards",
        "warp-speed": "warp-speed 0.8s cubic-bezier(0.4, 0, 1, 1) forwards",
      },
      keyframes: {
        "warp-speed": {
          "0%": {
            transform: "perspective(1000px) translateZ(0) scale(1)",
          },
          "100%": {
            transform: "perspective(1000px) translateZ(800px) scale(3)",
            opacity: "0",
          },
        },
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        "image-glitch": {
          "0%": {
            clipPath: "inset(20% 0 80% 0)",
            transform: "translate(-2px, 2px)"
          },
          "10%": {
            clipPath: "inset(10% 0 60% 0)",
            transform: "translate(2px, -2px)"
          },
          "20%": {
            clipPath: "inset(80% 0 5% 0)",
            transform: "translate(-2px, 2px)"
          },
          "30%": {
            clipPath: "inset(40% 0 10% 0)",
            transform: "translate(2px, -2px)"
          },
          "40%": {
            clipPath: "inset(5% 0 80% 0)",
            transform: "translate(-2px, 2px)"
          },
          "50%": {
            clipPath: "inset(60% 0 10% 0)",
            transform: "translate(2px, -2px)"
          },
          "60%": {
            clipPath: "inset(15% 0 60% 0)",
            transform: "translate(-2px, 2px)"
          },
          "70%": {
            clipPath: "inset(80% 0 5% 0)",
            transform: "translate(2px, -2px)"
          },
          "80%": {
            clipPath: "inset(5% 0 80% 0)",
            transform: "translate(-2px, 2px)"
          },
          "90%": {
            clipPath: "inset(40% 0 10% 0)",
            transform: "translate(2px, -2px)"
          },
          "100%": {
            clipPath: "inset(20% 0 80% 0)",
            transform: "translate(0)"
          }
        },
        blob: {
          "0%": {
            transform: "translate(0px, 0px) scale(1)",
          },
          "33%": {
            transform: "translate(30px, -50px) scale(1.1)",
          },
          "66%": {
            transform: "translate(-20px, 20px) scale(0.9)",
          },
          "100%": {
            transform: "translate(0px, 0px) scale(1)",
          },
        },
        "particle-fly": {
          "0%": {
            transform: "translate(0, 0) scale(1)",
            opacity: "1",
          },
          "100%": {
            transform: "translate(var(--tx), var(--ty)) scale(0)",
            opacity: "0",
          },
        },
      },
    },
  },
  plugins: [],
}
