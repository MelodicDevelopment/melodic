/**
 * Border tokens - radii and widths
 * Consistent, modern border radii for a polished look
 */
export const borderTokens = {
	// Border radii - slightly larger defaults for softer appearance
	'--ml-radius-none': '0',
	'--ml-radius-xxs': '0.125rem', // 2px
	'--ml-radius-xs': '0.25rem', // 4px
	'--ml-radius-sm': '0.375rem', // 6px
	'--ml-radius': '0.5rem', // 8px - default
	'--ml-radius-md': '0.5rem', // 8px
	'--ml-radius-lg': '0.75rem', // 12px
	'--ml-radius-xl': '1rem', // 16px
	'--ml-radius-2xl': '1.25rem', // 20px
	'--ml-radius-3xl': '1.5rem', // 24px
	'--ml-radius-4xl': '2rem', // 32px
	'--ml-radius-full': '9999px',

	// Border widths
	'--ml-border-0': '0',
	'--ml-border': '1px',
	'--ml-border-2': '2px',
	'--ml-border-4': '4px',
	'--ml-border-8': '8px'
} as const;
