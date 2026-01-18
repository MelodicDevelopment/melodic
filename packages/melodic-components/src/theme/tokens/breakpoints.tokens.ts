/**
 * Breakpoint tokens - responsive design breakpoints
 */
export const breakpointTokens = {
	'--ml-screen-xs': '320px',
	'--ml-screen-sm': '640px',
	'--ml-screen-md': '768px',
	'--ml-screen-lg': '1024px',
	'--ml-screen-xl': '1280px',
	'--ml-screen-2xl': '1536px'
} as const;

/**
 * Media query helpers (for use in JavaScript)
 */
export const breakpoints = {
	xs: 320,
	sm: 640,
	md: 768,
	lg: 1024,
	xl: 1280,
	'2xl': 1536
} as const;

export type Breakpoint = keyof typeof breakpoints;
