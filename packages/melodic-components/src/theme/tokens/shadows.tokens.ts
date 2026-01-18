/**
 * Shadow tokens - elevation and depth effects
 * Soft, subtle shadows for a clean modern look
 */
export const shadowTokens = {
	'--ml-shadow-none': 'none',
	'--ml-shadow-xs': '0 1px 2px 0 rgb(16 24 40 / 0.05)',
	'--ml-shadow-sm': '0 1px 2px 0 rgb(16 24 40 / 0.06), 0 1px 3px 0 rgb(16 24 40 / 0.1)',
	'--ml-shadow': '0 1px 2px 0 rgb(16 24 40 / 0.06), 0 1px 3px 0 rgb(16 24 40 / 0.1)',
	'--ml-shadow-md': '0 2px 4px -2px rgb(16 24 40 / 0.06), 0 4px 8px -2px rgb(16 24 40 / 0.1)',
	'--ml-shadow-lg': '0 4px 6px -2px rgb(16 24 40 / 0.03), 0 12px 16px -4px rgb(16 24 40 / 0.08)',
	'--ml-shadow-xl': '0 8px 8px -4px rgb(16 24 40 / 0.03), 0 20px 24px -4px rgb(16 24 40 / 0.08)',
	'--ml-shadow-2xl': '0 24px 48px -12px rgb(16 24 40 / 0.18)',
	'--ml-shadow-3xl': '0 32px 64px -12px rgb(16 24 40 / 0.14)',
	'--ml-shadow-inner': 'inset 0 2px 4px 0 rgb(16 24 40 / 0.05)',

	// Ring shadow for focus states - semantic tokens that can be themed
	'--ml-shadow-ring-color': 'var(--ml-blue-100)',
	'--ml-shadow-ring-error-color': 'var(--ml-red-100)',
	'--ml-shadow-ring-success-color': 'var(--ml-green-100)',
	'--ml-shadow-ring-warning-color': 'var(--ml-amber-100)',
	'--ml-shadow-ring-gray-color': 'var(--ml-gray-100)',

	'--ml-shadow-ring': '0 0 0 4px var(--ml-shadow-ring-color)',
	'--ml-shadow-ring-error': '0 0 0 4px var(--ml-shadow-ring-error-color)',
	'--ml-shadow-ring-success': '0 0 0 4px var(--ml-shadow-ring-success-color)',
	'--ml-shadow-ring-warning': '0 0 0 4px var(--ml-shadow-ring-warning-color)',
	'--ml-shadow-ring-gray': '0 0 0 4px var(--ml-shadow-ring-gray-color)',
	'--ml-shadow-focus-ring': '0 1px 2px 0 rgb(16 24 40 / 0.05), 0 0 0 4px var(--ml-shadow-ring-color)',

	// Colored shadows for buttons/cards - softer variants
	'--ml-shadow-primary': '0 1px 2px 0 rgb(21 94 239 / 0.05)',
	'--ml-shadow-success': '0 1px 2px 0 rgb(7 148 85 / 0.05)',
	'--ml-shadow-danger': '0 1px 2px 0 rgb(217 45 32 / 0.05)'
} as const;
