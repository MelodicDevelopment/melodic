/**
 * Light theme overrides
 * These are the default values, so mostly just confirms the base theme
 */
export const lightTheme = {
	// Surface colors
	'--ml-color-background': 'var(--ml-white)',
	'--ml-color-surface': 'var(--ml-white)',
	'--ml-color-surface-raised': 'var(--ml-gray-50)',
	'--ml-color-surface-overlay': 'var(--ml-white)',
	'--ml-color-surface-sunken': 'var(--ml-gray-100)',
	// Aliases, restated so they follow this theme when it is set on a subtree
	'--ml-color-surface-hover': 'var(--ml-color-surface-raised)',
	'--ml-color-surface-secondary': 'var(--ml-color-surface-raised)',
	'--ml-color-surface-tertiary': 'var(--ml-color-surface-sunken)',
	'--ml-color-bg-secondary': 'var(--ml-color-surface-raised)',

	// Text colors
	'--ml-color-text': 'var(--ml-gray-900)',
	'--ml-color-text-secondary': 'var(--ml-gray-700)',
	'--ml-color-text-muted': 'var(--ml-gray-500)',
	'--ml-color-text-subtle': 'var(--ml-gray-400)',
	'--ml-color-text-tertiary': 'var(--ml-color-text-muted)',
	'--ml-color-text-disabled': 'var(--ml-color-text-subtle)',
	'--ml-color-text-inverse': 'var(--ml-white)',

	// Border colors
	'--ml-color-border': 'var(--ml-gray-200)',
	'--ml-color-border-strong': 'var(--ml-gray-300)',
	'--ml-color-border-muted': 'var(--ml-gray-100)'
} as const;

/**
 * Light theme CSS
 */
export const lightThemeCss = `:root, [data-theme="light"] {
	${Object.entries(lightTheme)
		.map(([key, value]) => `${key}: ${value};`)
		.join('\n\t')}

	color-scheme: light;
}`;
