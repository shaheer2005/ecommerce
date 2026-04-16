/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                slate: {
                    950: "#030712",
                },
            },
            animation: {
                gradient: 'gradient-shift 3s ease infinite',
            },
        },
    },
    plugins: [],
}