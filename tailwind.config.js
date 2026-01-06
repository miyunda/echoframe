/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // Rosé Pine Dawn Palette
                base: '#faf4ed',
                surface: '#fffaf3',
                overlay: '#f2e9e1',
                muted: '#9893a5',
                subtle: '#797593',
                text: '#575279',
                love: '#b4637a',
                gold: '#ea9d34',
                rose: '#d7827e',
                pine: '#286983',
                foam: '#56949f',
                iris: '#907aa9',

                // Legacy mapping for existing gradient classes
                brand: {
                    start: '#d7827e', // Maaping brand-start to Rose
                    end: '#b4637a',   // Mapping brand-end to Love (Red/Pink vibes for dawn)
                    // Or should we use Pine/Foam? "Dawn" feels warm.
                    // User might want the "Dawn" aesthetic which is light/warm.
                    // Let's use Love -> Rose for brand gradient.
                }
            }
        },
    },
    plugins: [],
}
