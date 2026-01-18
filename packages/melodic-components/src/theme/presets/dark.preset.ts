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
	'--ml-color-info-subtle': 'var(--ml-cyan-950)',

	// Input colors for dark mode
	'--ml-color-input-bg': 'var(--ml-gray-900)',
	'--ml-color-input-disabled-bg': 'var(--ml-gray-800)',
	'--ml-color-toggle-off': 'var(--ml-gray-600)',
	'--ml-color-toggle-off-hover': 'var(--ml-gray-500)',

	// Focus ring colors for dark mode (more subtle)
	'--ml-shadow-ring-color': 'rgb(59 130 246 / 0.25)',
	'--ml-shadow-ring-error-color': 'rgb(239 68 68 / 0.25)',
	'--ml-shadow-ring-success-color': 'rgb(34 197 94 / 0.25)',
	'--ml-shadow-ring-warning-color': 'rgb(245 158 11 / 0.25)',
	'--ml-shadow-ring-gray-color': 'rgb(107 114 128 / 0.25)',

	// Badge colors for dark mode
	'--ml-badge-default-bg': 'var(--ml-gray-800)',
	'--ml-badge-default-border': 'var(--ml-gray-700)',
	'--ml-badge-default-text': 'var(--ml-gray-300)',

	'--ml-badge-primary-bg': 'rgb(59 130 246 / 0.15)',
	'--ml-badge-primary-border': 'rgb(59 130 246 / 0.3)',
	'--ml-badge-primary-text': 'var(--ml-blue-400)',

	'--ml-badge-success-bg': 'rgb(34 197 94 / 0.15)',
	'--ml-badge-success-border': 'rgb(34 197 94 / 0.3)',
	'--ml-badge-success-text': 'var(--ml-green-400)',

	'--ml-badge-warning-bg': 'rgb(245 158 11 / 0.15)',
	'--ml-badge-warning-border': 'rgb(245 158 11 / 0.3)',
	'--ml-badge-warning-text': 'var(--ml-amber-400)',

	'--ml-badge-error-bg': 'rgb(239 68 68 / 0.15)',
	'--ml-badge-error-border': 'rgb(239 68 68 / 0.3)',
	'--ml-badge-error-text': 'var(--ml-red-400)',

	// Alert colors for dark mode
	'--ml-alert-info-bg': 'rgb(59 130 246 / 0.1)',
	'--ml-alert-info-border': 'rgb(59 130 246 / 0.2)',
	'--ml-alert-info-text': 'var(--ml-blue-300)',
	'--ml-alert-info-icon': 'var(--ml-blue-400)',

	'--ml-alert-success-bg': 'rgb(34 197 94 / 0.1)',
	'--ml-alert-success-border': 'rgb(34 197 94 / 0.2)',
	'--ml-alert-success-text': 'var(--ml-green-300)',
	'--ml-alert-success-icon': 'var(--ml-green-400)',

	'--ml-alert-warning-bg': 'rgb(245 158 11 / 0.1)',
	'--ml-alert-warning-border': 'rgb(245 158 11 / 0.2)',
	'--ml-alert-warning-text': 'var(--ml-amber-300)',
	'--ml-alert-warning-icon': 'var(--ml-amber-400)',

	'--ml-alert-error-bg': 'rgb(239 68 68 / 0.1)',
	'--ml-alert-error-border': 'rgb(239 68 68 / 0.2)',
	'--ml-alert-error-text': 'var(--ml-red-300)',
	'--ml-alert-error-icon': 'var(--ml-red-400)',

	// Tooltip colors for dark mode (inverted)
	'--ml-tooltip-bg': 'var(--ml-gray-100)',
	'--ml-tooltip-text': 'var(--ml-gray-900)',

	// Card footer
	'--ml-card-footer-bg': 'var(--ml-gray-800)'
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
