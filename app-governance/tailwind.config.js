module.exports = {
    content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
    presets: [require("nativewind/preset")],
    theme: {
        extend: {
            colors: {
                primary: '#1e3a8a', // Deep Navy
                accent: '#f59e0b',  // Alert Orange
            }
        }
    },
    plugins: [],
}