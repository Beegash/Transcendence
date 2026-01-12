/** @type {import('tailwindcss').Config} */
export default {
	content: [
		"./index.html",
		"./src/**/*.{js,ts,jsx,tsx,html}",
	],
	theme: {
		extend: {
			colors: {
				// Custom Pong theme colors
				'pong': {
					'primary': '#00ff88',
					'secondary': '#0088ff',
					'dark': '#0a0a0f',
					'darker': '#050508',
					'light': '#1a1a2e',
					'accent': '#ff0088',
				},
			},
			fontFamily: {
				'game': ['Orbitron', 'monospace'],
				'body': ['Inter', 'sans-serif'],
			},
			animation: {
				'glow': 'glow 2s ease-in-out infinite alternate',
				'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
			},
			keyframes: {
				glow: {
					'0%': { boxShadow: '0 0 5px #00ff88, 0 0 10px #00ff88' },
					'100%': { boxShadow: '0 0 20px #00ff88, 0 0 30px #00ff88' },
				},
			},
		},
	},
	plugins: [],
}
