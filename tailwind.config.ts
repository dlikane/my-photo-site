import type { Config } from 'tailwindcss';
import scrollbarHide from 'tailwind-scrollbar-hide'

const config: Config = {
    content: [
        "./index.html",
        "./src/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: "#ffffff",
                secondary: "#aaaaaa",
                background: "#000000",
            },
            fontFamily: {
                body: ["Cormorant Garamond", "serif"],
                title: ["Big Shoulders", "Futura", "Gill Sans", "Helvetica Neue", "sans-serif"],
            },
        },
    },
    plugins: [scrollbarHide],
};

export default config;