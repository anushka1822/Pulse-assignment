/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: '#6366f1', // Indigo-500
                    hover: '#4f46e5',   // Indigo-600
                    light: '#818cf8',   // Indigo-400
                },
                secondary: {
                    DEFAULT: '#10b981', // Emerald-500
                    hover: '#059669',   // Emerald-600
                },
                dark: {
                    900: '#0a0a0c', // Darkest
                    800: '#151518', // Card background
                    700: '#212124', // Input/hover background
                    600: '#2d2d31',
                }
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            },
            borderRadius: {
                'xl': '1rem',
                '2xl': '1.5rem',
            },
            boxShadow: {
                'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
            }
        },
    },
    plugins: [],
}
