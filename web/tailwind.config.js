/** @type {import('tailwindcss').Config} */
export default {
	content: [
		"./index.html",
		"./src/**/*.{js,ts,jsx,tsx,html}",
	],
	theme: {
		extend: {
			colors: {
				// Marty Supreme Theme Colors
				'pong': {
					'primary': '#EA871E',      // Orange/Gold (main)
					'secondary': '#F5B041',    // Light Gold
					'dark': '#1A1A1A',         // Warm Dark
					'darker': '#0D0D0D',       // Deep Black
					'light': '#2C2C2C',        // Warm Gray
					'accent': '#FFD700',       // Gold Accent
				},
			},
			fontFamily: {
				'game': ['"Helvetica Condensed"', '"Arial Narrow"', 'sans-serif'],
				'body': ['"Gill Sans"', '"Gill Sans MT"', 'Calibri', 'sans-serif'],
			},
			animation: {
				'glow': 'glow 2s ease-in-out infinite alternate',
				'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
				'float': 'float 3s ease-in-out infinite',
			},
			keyframes: {
				glow: {
					'0%': { boxShadow: '0 0 5px #EA871E, 0 0 10px #EA871E' },
					'100%': { boxShadow: '0 0 20px #EA871E, 0 0 30px #F5B041' },
				},
				float: {
					'0%, 100%': { transform: 'translateY(0)' },
					'50%': { transform: 'translateY(-10px)' },
				},
			},
		},
	},
	plugins: [],
}

