import type { Config } from "tailwindcss";

const config: Config = {
	darkMode: "class",
	content: ["./src/components/**/*.{js,ts,jsx,tsx,mdx}", "./src/app/**/*.{js,ts,jsx,tsx,mdx}"],
	theme: {
		container: {
			center: true,
			padding: "2rem",
			screens: {
				"2xl": "1400px",
			},
		},
		extend: {
			fontFamily: {
				zen: ["var(--font-zen-old-mincho)"],
			},
			colors: {
				border: "hsl(var(--border))",
				input: "hsl(var(--input))",
				ring: "hsl(var(--ring))",
				background: "hsl(var(--background))",
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
			borderRadius: {
				lg: "var(--radius)",
				md: "calc(var(--radius) - 2px)",
				sm: "calc(var(--radius) - 4px)",
			},
			keyframes: {
				"accordion-down": {
					from: {
						height: "0",
					},
					to: {
						height: "var(--radix-accordion-content-height)",
					},
				},
				"accordion-up": {
					from: {
						height: "var(--radix-accordion-content-height)",
					},
					to: {
						height: "0",
					},
				},
				expand: {
					"0%": {
						height: "0",
						opacity: "0",
					},
					"100%": {
						height: "var(--radix-collapsible-content-height)",
						opacity: "1",
					},
				},
				collapse: {
					"0%": {
						height: "var(--radix-collapsible-content-height)",
						opacity: "1",
					},
					"25%": {
						opacity: "0",
					},
					"100%": {
						height: "0",
						opacity: "0",
					},
				},
			},
			animation: {
				expand: "expand 0.3s ease-out",
				collapse: "collapse 0.3s ease-out",
				"accordion-down": "accordion-down 0.2s ease-out",
				"accordion-up": "accordion-up 0.2s ease-out",
			},
			typography: {
				DEFAULT: {
					css: {
						maxWidth: "100%",
						color: "hsl(var(--foreground))",
						a: {
							color: "hsl(var(--primary))",
							"&:hover": {
								color: "hsl(var(--primary))",
							},
						},
						strong: {
							color: "hsl(var(--foreground))",
						},
						"ol > li::marker": {
							color: "hsl(var(--foreground))",
						},
						"ul > li::marker": {
							color: "hsl(var(--foreground))",
						},
						hr: {
							borderColor: "hsl(var(--border))",
						},
						blockquote: {
							borderLeftColor: "hsl(var(--border))",
							color: "hsl(var(--foreground))",
						},
						h1: {
							color: "hsl(var(--foreground))",
						},
						h2: {
							color: "hsl(var(--foreground))",
						},
						h3: {
							color: "hsl(var(--foreground))",
						},
						h4: {
							color: "hsl(var(--foreground))",
						},
						"figure figcaption": {
							color: "hsl(var(--muted-foreground))",
						},
						code: {
							color: "hsl(var(--foreground))",
						},
						"a code": {
							color: "hsl(var(--primary))",
						},
						pre: {
							backgroundColor: "hsl(var(--muted))",
							color: "hsl(var(--foreground))",
						},
						thead: {
							color: "hsl(var(--foreground))",
							borderBottomColor: "hsl(var(--border))",
						},
						"tbody tr": {
							borderBottomColor: "hsl(var(--border))",
						},
						"ol[type=A s]: false": false,
						"ol[type=a s]: false": false,
						"ol[type=I s]: false": false,
						"ol[type=i s]: false": false,
					},
				},
			},
		},
	},
	plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
};

export default config;
