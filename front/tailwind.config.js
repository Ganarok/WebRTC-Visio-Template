/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./pages/**/*.{js,ts,jsx,tsx}",
        "./src/components/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'rtc-turquoise': '#1EE6CB',
                'rtc-red': '#FF7878',
                'rtc-black' : '#272839'
            }
        },
    },
    plugins: [],
}
