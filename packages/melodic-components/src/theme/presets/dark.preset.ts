/**
 * Dark theme overrides
 */
export const darkTheme = {
	// Surface colors - darker backgrounds
	'--ml-color-background': 'var(--ml-gray-950)',
	'--ml-color-surface': 'var(--ml-gray-900)',
	'--ml-color-surface-raised': 'var(--ml-gray-800)',
	'--ml-color-surface-overlay': 'var(--ml-gray-800)',
	'--ml-color-surface-sunken': 'var(--ml-gray-950)',

	// Text colors - lighter text for dark backgrounds
	'--ml-color-text': 'var(--ml-gray-50)',
	'--ml-color-text-secondary': 'var(--ml-gray-300)',
	'--ml-color-text-muted': 'var(--ml-gray-400)',
	'--ml-color-text-subtle': 'var(--ml-gray-500)',
	'--ml-color-text-inverse': 'var(--ml-gray-900)',

	// Border colors - more visible on dark
	'--ml-color-border': 'var(--ml-gray-700)',
	'--ml-color-border-strong': 'var(--ml-gray-600)',
	'--ml-color-border-muted': 'var(--ml-gray-800)',

	// Adjusted primary colors for better contrast
	'--ml-color-primary': 'var(--ml-blue-500)',
	'--ml-color-primary-hover': 'var(--ml-blue-400)',
	'--ml-color-primary-active': 'var(--ml-blue-300)',
	'--ml-color-primary-subtle': 'var(--ml-blue-950)',

	// Adjusted semantic colors
	'--ml-color-success': 'var(--ml-green-500)',
	'--ml-color-success-subtle': 'var(--ml-green-950)',
	'--ml-color-warning': 'var(--ml-amber-400)',
	'--ml-color-warning-subtle': 'var(--ml-amber-950)',
	'--ml-color-danger': 'var(--ml-red-500)',
	'--ml-color-danger-subtle': 'var(--ml-red-950)',
	'--ml-color-info': 'var(--ml-cyan-400)',
	'--ml-color-info-subtle': 'var(--ml-cyan-950)'
} as const;

/**
 * Dark theme CSS
 */
export const darkThemeCss = `[data-theme="dark"] {
	${Object.entries(darkTheme)
		.map(([key, value]) => `${key}: ${value};`)
		.join('\n\t')}

	color-scheme: dark;
}

@media (prefers-color-scheme: dark) {
	:root:not([data-theme="light"]) {
		${Object.entries(darkTheme)
			.map(([key, value]) => `${key}: ${value};`)
			.join('\n\t\t')}

		color-scheme: dark;
	}
}`;
