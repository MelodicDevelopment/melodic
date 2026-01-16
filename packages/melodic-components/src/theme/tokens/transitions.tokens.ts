/**
 * Transition tokens - durations and easing functions
 */
export const transitionTokens = {
	// Durations
	'--ml-duration-0': '0ms',
	'--ml-duration-75': '75ms',
	'--ml-duration-100': '100ms',
	'--ml-duration-150': '150ms',
	'--ml-duration-200': '200ms',
	'--ml-duration-300': '300ms',
	'--ml-duration-500': '500ms',
	'--ml-duration-700': '700ms',
	'--ml-duration-1000': '1000ms',

	// Easing functions
	'--ml-ease-linear': 'linear',
	'--ml-ease-in': 'cubic-bezier(0.4, 0, 1, 1)',
	'--ml-ease-out': 'cubic-bezier(0, 0, 0.2, 1)',
	'--ml-ease-in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
	'--ml-ease-bounce': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',

	// Common transition presets
	'--ml-transition-none': 'none',
	'--ml-transition-all': 'all var(--ml-duration-150) var(--ml-ease-in-out)',
	'--ml-transition-colors':
		'color var(--ml-duration-150) var(--ml-ease-in-out), background-color var(--ml-duration-150) var(--ml-ease-in-out), border-color var(--ml-duration-150) var(--ml-ease-in-out)',
	'--ml-transition-opacity': 'opacity var(--ml-duration-150) var(--ml-ease-in-out)',
	'--ml-transition-shadow': 'box-shadow var(--ml-duration-150) var(--ml-ease-in-out)',
	'--ml-transition-transform': 'transform var(--ml-duration-150) var(--ml-ease-in-out)'
} as const;
