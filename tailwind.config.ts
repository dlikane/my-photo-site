import type { Config } from 'tailwindcss';
import scrollbarHide from 'tailwind-scrollbar-hide'

const config: Config = {
    darkMode: "class", // ✅ Switch from 'media' to 'class'
    content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
    theme: {
        extend: {
            colors: {
                primary: "#ffffff",
                secondary: "#aaaaaa",
                background: "#000000",
            },
            fontFamily: {
                body: ["Cormorant Garamond", "serif"],
                title: ["Big Shoulders Display", "Futura", "Gill Sans", "Helvetica Neue", "sans-serif"],
            },
            animation: {
                'spin-slow': 'spin 2.5s linear infinite',
            },
        },
    },
    plugins: [scrollbarHide],
}

export default config;