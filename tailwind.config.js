/** @type {import('tailwindcss').Config} */
export default {
	content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
	theme: {
		extend: {
			// Custom animation easing following the guidelines
			transitionTimingFunction: {
				'ease-out-smooth': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
				'ease-out-quick': 'cubic-bezier(0.165, 0.84, 0.44, 1)',
				'ease-in-out-smooth': 'cubic-bezier(0.645, 0.045, 0.355, 1)',
			},
			// Animation durations following 0.2s to 0.3s guideline
			transitionDuration: {
				200: '200ms',
				250: '250ms',
				300: '300ms',
			},
			// Custom keyframe animations
			keyframes: {
				'fade-in': {
					'0%': { opacity: '0' },
					'100%': { opacity: '1' },
				},
				'fade-out': {
					'0%': { opacity: '1' },
					'100%': { opacity: '0' },
				},
				'slide-down': {
					'0%': { transform: 'translateY(-10px)', opacity: '0' },
					'100%': { transform: 'translateY(0)', opacity: '1' },
				},
				'slide-up': {
					'0%': { transform: 'translateY(10px)', opacity: '0' },
					'100%': { transform: 'translateY(0)', opacity: '1' },
				},
				'scale-in': {
					'0%': { transform: 'scale(0.95)', opacity: '0' },
					'100%': { transform: 'scale(1)', opacity: '1' },
				},
				'scale-out': {
					'0%': { transform: 'scale(1)', opacity: '1' },
					'100%': { transform: 'scale(0.95)', opacity: '0' },
				},
				expand: {
					'0%': { transform: 'scaleY(0)', opacity: '0' },
					'100%': { transform: 'scaleY(1)', opacity: '1' },
				},
				collapse: {
					'0%': { transform: 'scaleY(1)', opacity: '1' },
					'100%': { transform: 'scaleY(0)', opacity: '0' },
				},
			},
			animation: {
				'fade-in': 'fade-in 0.2s ease-out-smooth forwards',
				'fade-out': 'fade-out 0.2s ease-out-smooth forwards',
				'slide-down': 'slide-down 0.25s ease-out-smooth forwards',
				'slide-up': 'slide-up 0.25s ease-out-smooth forwards',
				'scale-in': 'scale-in 0.2s ease-out-quick forwards',
				'scale-out': 'scale-out 0.2s ease-out-quick forwards',
				expand: 'expand 0.3s ease-out-smooth forwards',
				collapse: 'collapse 0.3s ease-out-smooth forwards',
			},
		},
	},
	plugins: [],
}
