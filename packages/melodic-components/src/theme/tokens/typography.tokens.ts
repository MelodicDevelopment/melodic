/**
 * Typography tokens - font families, sizes, weights, and line heights
 */
export const typographyTokens = {
	// Font families
	'--ml-font-sans':
		"system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'",
	'--ml-font-serif': "Georgia, Cambria, 'Times New Roman', Times, serif",
	'--ml-font-mono': "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",

	// Font sizes
	'--ml-text-xs': '0.75rem', // 12px
	'--ml-text-sm': '0.875rem', // 14px
	'--ml-text-base': '1rem', // 16px
	'--ml-text-lg': '1.125rem', // 18px
	'--ml-text-xl': '1.25rem', // 20px
	'--ml-text-2xl': '1.5rem', // 24px
	'--ml-text-3xl': '1.875rem', // 30px
	'--ml-text-4xl': '2.25rem', // 36px
	'--ml-text-5xl': '3rem', // 48px
	'--ml-text-6xl': '3.75rem', // 60px
	'--ml-text-7xl': '4.5rem', // 72px
	'--ml-text-8xl': '6rem', // 96px
	'--ml-text-9xl': '8rem', // 128px

	// Font weights
	'--ml-font-thin': '100',
	'--ml-font-extralight': '200',
	'--ml-font-light': '300',
	'--ml-font-normal': '400',
	'--ml-font-medium': '500',
	'--ml-font-semibold': '600',
	'--ml-font-bold': '700',
	'--ml-font-extrabold': '800',
	'--ml-font-black': '900',

	// Line heights
	'--ml-leading-none': '1',
	'--ml-leading-tight': '1.25',
	'--ml-leading-snug': '1.375',
	'--ml-leading-normal': '1.5',
	'--ml-leading-relaxed': '1.625',
	'--ml-leading-loose': '2',

	// Letter spacing
	'--ml-tracking-tighter': '-0.05em',
	'--ml-tracking-tight': '-0.025em',
	'--ml-tracking-normal': '0em',
	'--ml-tracking-wide': '0.025em',
	'--ml-tracking-wider': '0.05em',
	'--ml-tracking-widest': '0.1em'
} as const;
