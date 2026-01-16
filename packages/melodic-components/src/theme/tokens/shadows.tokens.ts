/**
 * Shadow tokens - elevation and depth effects
 */
export const shadowTokens = {
	'--ml-shadow-none': 'none',
	'--ml-shadow-xs': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
	'--ml-shadow-sm': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
	'--ml-shadow': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
	'--ml-shadow-md': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
	'--ml-shadow-lg': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
	'--ml-shadow-xl': '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
	'--ml-shadow-2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
	'--ml-shadow-inner': 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',

	// Colored shadows for buttons/cards
	'--ml-shadow-primary': '0 4px 14px 0 rgb(37 99 235 / 0.25)',
	'--ml-shadow-success': '0 4px 14px 0 rgb(22 163 74 / 0.25)',
	'--ml-shadow-danger': '0 4px 14px 0 rgb(220 38 38 / 0.25)'
} as const;
