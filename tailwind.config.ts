import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

const config = {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: "2rem",
			screens: {
				"2xl": "1400px",
			},
		},
		extend: {
			colors: {
				border: "hsl(var(--border)/0.75)",
				outline: "color-mix(in oklab, #09090b 10%, transparent)",
				input: "hsl(var(--input))",
				ring: "hsl(var(--ring))",
				background: "hsl(var(--background))",
				containerBackground: "#f6f6f8",
				containerHollowBackground: "hsl(230deg 37.5% 93.86%) ",
				foreground: "hsl(var(--foreground))",
				primary: {
					DEFAULT: "hsl(var(--primary))",
					foreground: "hsl(var(--primary-foreground))",
				},
				secondary: {
					DEFAULT: "hsl(var(--secondary))",
					foreground: "hsl(var(--secondary-foreground))",
				},
				destructive: {
					DEFAULT: "hsl(var(--destructive))",
					foreground: "hsl(var(--destructive-foreground))",
				},
				muted: {
					DEFAULT: "hsl(var(--muted))",
					foreground: "hsl(var(--muted-foreground))",
				},
				accent: {
					DEFAULT: "hsl(var(--accent))",
					foreground: "hsl(var(--accent-foreground))",
				},
				popover: {
					DEFAULT: "hsl(var(--popover))",
					foreground: "hsl(var(--popover-foreground))",
				},
				card: {
					DEFAULT: "hsl(var(--card))",
					foreground: "hsl(var(--card-foreground))",
				},
			},
			borderRadius: {
				lg: "var(--radius)",
				md: "calc(var(--radius) - 2px)",
				sm: "calc(var(--radius) - 4px)",
			},
			backgroundImage: {
				dashedInput:
					//Poor man's antialiasing
					// if doing things like
					//////"repeating-linear-gradient(-60deg, #black 0px, white 0px, white 7px);"
					//// is black stripe at 0px, white gradient from 0px to 7px, then black stripe at 8px
					//// the black stripes will look pixelated, so we do
					//////"repeating-linear-gradient(-60deg, #black 0px, white 1px, white 7px, #black 8px);"
					//// which is basically: gradient from 0px to 1px (which looks like a black stripe), then white stripe from 1px to 7px. which solves the pixelation issue
					"repeating-linear-gradient(-60deg, #9f9f9f 0px, white 1px, white 7px, #9f9f9f 8px);",
			},
			boxShadow: {
				DEFAULT:
					"0px 10px 4px 0px rgba(0, 0, 0, 0.01), 0px 6px 3px 0px rgba(0, 0, 0, 0.02), 0px 3px 3px 0px rgba(0, 0, 0, 0.04), 0px 1px 1px 0px rgba(0, 0, 0, 0.05), inset 0px -1.5px 0px 0px rgba(0, 0, 0, 0.05), inset 0px 1.5px 0px 0px rgba(255, 255, 255, 0.5)",
				lite: "inset 0px -1.5px 0px 0px rgba(0, 0, 0, 0.05), inset 0px 1.5px 0px 0px rgba(255, 255, 255, 0.5)",
				clicked:
					"0px 0px 0px 0px rgba(0, 0, 0, 0.01), 0px 0px 0px 0px rgba(0, 0, 0, 0.02), 0px 0px 0px 0px rgba(0, 0, 0, 0.04), 0px 0px 0px 0px rgba(0, 0, 0, 0.05), inset 0px -1.5px 0px 0px rgba(0, 0, 0, 0), inset 0px 1.5px 0px 0px rgba(255, 255, 255, 0.5)",
			},
			keyframes: {
				"accordion-down": {
					from: { height: "0" },
					to: { height: "var(--radix-accordion-content-height)" },
				},
				"accordion-up": {
					from: { height: "var(--radix-accordion-content-height)" },
					to: { height: "0" },
				},
				slide: {
					'0%':   { transform: 'translateX(-100px)' },
					'100%': { transform: 'translateX(100px)'   },
				},
				pulsebg: {
					'0%, 100%': { opacity: '0.7' },
					'50%':      { opacity: '1'   },
				},
			},
			animation: {
				'bg-slide': 'slide 3s ease-in-out infinite alternate',
				'bg-pulse': 'pulsebg 2s ease-in-out infinite',
				"accordion-down": "accordion-down 0.2s ease-out",
				"accordion-up": "accordion-up 0.2s ease-out",
			},
			transitionTimingFunction: {
				spring:
					"linear(0, 0.0018, 0.0071 1.18%, 0.0262 2.37%, 0.0897 4.74%, 0.4915 15.4%, 0.5885, 0.6719, 0.7418, 0.7991 27.25%, 0.8534, 0.8946 34.36%, 0.9295, 0.9537 42.66%, 0.9639 45.03%, 0.9737 47.99%, 0.9866 53.92%, 0.9939 60.43%, 0.998 68.73%, 1.0001 99.54%)",
			},
		},
	},
	plugins: [animate],
} satisfies Config;

export default config;
