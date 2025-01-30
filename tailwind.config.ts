import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{js,ts,jsx,tsx,mdx}",
		"./components/**/*.{js,ts,jsx,tsx,mdx}",
		"./app/**/*.{js,ts,jsx,tsx,mdx}",
	],
	theme: {
		extend: {
			colors: {
				background: "hsl(var(--background))",
				foreground: "hsl(var(--foreground))",
				brand: {
					DEFAULT: "hsl(var(--brand))",
					background: "hsl(var(--brand-background))",
					foreground: "hsl(var(--brand-foreground))",
					secondary: "hsl(var(--brand-secondary))",
					border: "hsl(var(--border))",
				},
				accent: {
					DEFAULT: "hsl(var(--accent))",
					background: "hsl(var(--accent-background))",
					foreground: "hsl(var(--accent-foreground))",
					secondary: "hsl(var(--accent-secondary))",
				},
				destructive: {
					DEFAULT: "hsl(var(--destructive))",
					background: "hsl(var(--destructive-background))",
					foreground: "hsl(var(--destructive-foreground))",
					secondary: "hsl(var(--destructive-secondary))",
					border: "hsl(var(--destructive-border))",
				},
				success: {
					DEFAULT: "hsl(var(--success))",
					background: "hsl(var(--success-background))",
					foreground: "hsl(var(--success-foreground))",
					secondary: "hsl(var(--success-secondary))",
					border: "hsl(var(--success-border))",
				},
				alert: {
					DEFAULT: "hsl(var(--alert))",
					background: "hsl(var(--alert-background))",
					foreground: "hsl(var(--alert-foreground))",
					secondary: "hsl(var(--alert-secondary))",
					border: "hsl(var(--alert-border))",
				},
				input: {
					DEFAULT: "hsl(var(--input))",
					background: "hsl(var(--input-background))",
					foreground: "hsl(var(--input-foreground))",
					secondary: "hsl(var(--input-secondary))",
				},
				card: {
					DEFAULT: "hsl(var(--card))",
					foreground: "hsl(var(--card-foreground))",
				},
				popover: {
					DEFAULT: "hsl(var(--popover))",
					foreground: "hsl(var(--popover-foreground))",
				},
				primary: {
					DEFAULT: "hsl(var(--primary))",
					foreground: "hsl(var(--primary-foreground))",
				},
				secondary: {
					DEFAULT: "hsl(var(--secondary))",
					foreground: "hsl(var(--secondary-foreground))",
				},
				muted: {
					DEFAULT: "hsl(var(--muted))",
					foreground: "hsl(var(--muted-foreground))",
				},
				border: "hsl(var(--border))",
				ring: "hsl(var(--ring))",
				black: "hsl(var(--black))",
				chart: {
					"1": "hsl(var(--chart-1))",
					"2": "hsl(var(--chart-2))",
					"3": "hsl(var(--chart-3))",
					"4": "hsl(var(--chart-4))",
					"5": "hsl(var(--chart-5))",
				},
				sidebar: {
					DEFAULT: "hsl(var(--sidebar-background))",
					foreground: "hsl(var(--sidebar-foreground))",
					primary: "hsl(var(--sidebar-primary))",
					"primary-foreground": "hsl(var(--sidebar-primary-foreground))",
					accent: "hsl(var(--sidebar-accent))",
					"accent-foreground": "hsl(var(--sidebar-accent-foreground))",
					border: "hsl(var(--sidebar-border))",
					ring: "hsl(var(--sidebar-ring))",
				},
			},
			textColor: {
				foreground: {
					DEFAULT: "hsl(var(--foreground))",
					dim: "hsl(var(--foreground-dim))",
					muted: "hsl(var(--foreground-muted))",
					secondary: "hsl(var(--foreground-secondary))",
				},
				brand: {
					DEFAULT: "hsl(var(--brand-foreground))",
					secondary: "hsl(var(--brand-secondary))",
				},
				accent: {
					DEFAULT: "hsl(var(--accent-foreground))",
					secondary: "hsl(var(--accent-secondary))",
				},
				destructive: {
					DEFAULT: "hsl(var(--destructive-foreground))",
					secondary: "hsl(var(--destructive-secondary))",
				},
				success: {
					DEFAULT: "hsl(var(--success-foreground))",
					secondary: "hsl(var(--success-secondary))",
				},
				alert: {
					DEFAULT: "hsl(var(--alert-foreground))",
					secondary: "hsl(var(--alert-secondary))",
				},
				input: {
					DEFAULT: "hsl(var(--input-foreground))",
					secondary: "hsl(var(--input-secondary))",
				},
			},
			boxShadow: {
				DEFAULT: "0 3px 4px -2px hsl(var(--border))",
				hover: "0 3px 5px 0px hsl(var(--border))",
				simple:
					"inset 0 1px 0 hsla(0, 0%, 100%, .25),0 0 0 1px hsl(203, 13%, 12%), 0 0.3px 0.4px hsla(203,86%,12%,0.02),0 0.9px 1.5px hsla(203,86%,12%,0.045),0 3.5px 6px hsla(203,86%,12%,0.09)",
				"simple-hover":
					"inset 0 1px 0 hsla(0, 0%, 100%, .15),0 0 0 1px hsl(203, 13%, 12%), 0 0.3px 0.4px hsla(203,86%,12%,0.02),0 0.9px 1.5px hsla(203,86%,12%,0.045),0 3.5px 6px hsla(203,86%,12%,0.09), inset 0px 11px 10px -10px hsla(0, 0%, 100%, 0.35)",
				"simple-destructive":
					"inset 0 1px 0 hsla(0, 0%, 100%, .15),0 0 0 1px hsl(var(--destructive-border)), 0 0.3px 0.4px hsla(203,86%,12%,0.02),0 0.9px 1.5px hsla(203,86%,12%,0.045),0 3.5px 6px hsla(203,86%,12%,0.09)",
				"simple-destructive-hover":
					"inset 0 1px 0 hsla(0, 0%, 100%, .15),0 0 0 1px hsl(var(--destructive-border)), 0 0.3px 0.4px hsla(203,86%,12%,0.02),0 0.9px 1.5px hsla(203,86%,12%,0.045),0 3.5px 6px hsla(203,86%,12%,0.09), inset 0px 11px 10px -10px hsla(0, 0%, 100%, 0.35)",
				"simple-success":
					"inset 0 1px 0 hsla(0, 0%, 100%, .15),0 0 0 1px hsl(var(--success-border)), 0 0.3px 0.4px hsla(203,86%,12%,0.02),0 0.9px 1.5px hsla(203,86%,12%,0.045),0 3.5px 6px hsla(203,86%,12%,0.09)",
				"simple-success-hover":
					"inset 0 1px 0 hsla(0, 0%, 100%, .15),0 0 0 1px hsl(var(--success-border)), 0 0.3px 0.4px hsla(203,86%,12%,0.02),0 0.9px 1.5px hsla(203,86%,12%,0.045),0 3.5px 6px hsla(203,86%,12%,0.09), inset 0px 11px 10px -10px hsla(0, 0%, 100%, 0.35)",
				"simple-alert":
					"inset 0 1px 0 hsla(0, 0%, 100%, .15),0 0 0 1px hsl(var(--alert-border)), 0 0.3px 0.4px hsla(203,86%,12%,0.02),0 0.9px 1.5px hsla(203,86%,12%,0.045),0 3.5px 6px hsla(203,86%,12%,0.09)",
				"simple-alert-hover":
					"inset 0 1px 0 hsla(0, 0%, 100%, .15),0 0 0 1px hsl(var(--alert-border)), 0 0.3px 0.4px hsla(203,86%,12%,0.02),0 0.9px 1.5px hsla(203,86%,12%,0.045),0 3.5px 6px hsla(203,86%,12%,0.09), inset 0px 11px 10px -10px hsla(0, 0%, 100%, 0.35)",
				custom2:
					"inset 0 1px 0 hsla(0, 0%, 100%, .15),0 0 0 1px hsl(203, 13%, 12%, .075), 0 0 0 1px hsla(203,86%,12%,0.02),0 1px 3px -1px hsla(203,86%,12%,0.045)",
				"2sm": "0 1px 2px 0 hsl(var(--border))",
				"3sm": "0 2px 3px 0 hsl(var(--border))",
			},
			borderRadius: {
				lg: "var(--radius)",
				md: "calc(var(--radius) - 2px)",
				sm: "calc(var(--radius) - 4px)",
			},
			borderColor: {
				DEFAULT: "hsl(var(--border))",
				brand: "hsl(var(--brand-border))",
				input: "hsl(var(--input-border))",
				warning: "hsl(var(--warning-border))",
				success: "hsl(var(--success-border))",
				destructive: "hsl(var(--destructive-border))",
				dark: "hsl(var(--dark-border))",
			},
			ringColor: {
				DEFAULT: "hsl(var(--border))",
				brand: "hsl(var(--blue-500))",
				input: "hsl(var(--navy-400))",
				warning: "hsl(var(--yellow-500))",
				success: "hsl(var(--green-500))",
				destructive: "hsl(var(--border-destructive))",
				dark: "hsl(var(--navy-900))",
			},
			fontFamily: {
				sans: ["var(--font-sans)"],
			},
			transitionTimingFunction: {
				"in-quad": "cubic-bezier(0.55, 0.085, 0.68, 0.53)",
				"in-cubic": "cubic-bezier(0.55, 0.055, 0.675, 0.19)",
				"in-quart": "cubic-bezier(0.895, 0.03, 0.685, 0.22)",
				"in-quint": "cubic-bezier(0.755, 0.05, 0.855, 0.06)",
				"in-expo": "cubic-bezier(0.95, 0.05, 0.795, 0.035)",
				"in-circ": "cubic-bezier(0.6, 0.04, 0.98, 0.335)",

				"out-quad": "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
				"out-cubic": "cubic-bezier(0.215, 0.61, 0.355, 1)",
				"out-quart": "cubic-bezier(0.165, 0.84, 0.44, 1)",
				"out-quint": "cubic-bezier(0.23, 1, 0.32, 1)",
				"out-expo": "cubic-bezier(0.19, 1, 0.22, 1)",
				"out-circ": "cubic-bezier(0.075, 0.82, 0.165, 1)",

				"in-out-quad": "cubic-bezier(0.455, 0.03, 0.515, 0.955)",
				"in-out-cubic": "cubic-bezier(0.645, 0.045, 0.355, 1)",
				"in-out-quart": "cubic-bezier(0.77, 0, 0.175, 1)",
				"in-out-quint": "cubic-bezier(0.86, 0, 0.07, 1)",
				"in-out-expo": "cubic-bezier(1, 0, 0, 1)",
				"in-out-circ": "cubic-bezier(0.785, 0.135, 0.15, 0.86)",
			},
		},
	},
	safelist: ["border-brand-border"],
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
