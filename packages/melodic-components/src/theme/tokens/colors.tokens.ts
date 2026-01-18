/**
 * Primitive color palette - these are the raw color values
 * Soft neutrals and refined colors inspired by modern UI design
 */
export const primitiveColors = {
	// White & Black
	'--ml-white': '#ffffff',
	'--ml-black': '#000000',

	// Gray scale - Softer, warmer neutrals
	'--ml-gray-25': '#fcfcfd',
	'--ml-gray-50': '#f9fafb',
	'--ml-gray-100': '#f2f4f7',
	'--ml-gray-200': '#eaecf0',
	'--ml-gray-300': '#d0d5dd',
	'--ml-gray-400': '#98a2b3',
	'--ml-gray-500': '#667085',
	'--ml-gray-600': '#475467',
	'--ml-gray-700': '#344054',
	'--ml-gray-800': '#182230',
	'--ml-gray-900': '#101828',
	'--ml-gray-950': '#0c111d',

	// Blue - Primary brand color, softer and more refined
	'--ml-blue-25': '#f5f8ff',
	'--ml-blue-50': '#eff4ff',
	'--ml-blue-100': '#d1e0ff',
	'--ml-blue-200': '#b2ccff',
	'--ml-blue-300': '#84adff',
	'--ml-blue-400': '#528bff',
	'--ml-blue-500': '#2970ff',
	'--ml-blue-600': '#155eef',
	'--ml-blue-700': '#004eeb',
	'--ml-blue-800': '#0040c1',
	'--ml-blue-900': '#00359e',
	'--ml-blue-950': '#002266',

	// Green - Success color, balanced and calming
	'--ml-green-25': '#f6fef9',
	'--ml-green-50': '#ecfdf3',
	'--ml-green-100': '#dcfae6',
	'--ml-green-200': '#abefc6',
	'--ml-green-300': '#75e0a7',
	'--ml-green-400': '#47cd89',
	'--ml-green-500': '#17b26a',
	'--ml-green-600': '#079455',
	'--ml-green-700': '#067647',
	'--ml-green-800': '#085d3a',
	'--ml-green-900': '#074d31',
	'--ml-green-950': '#053321',

	// Red - Error/danger color, refined
	'--ml-red-25': '#fffbfa',
	'--ml-red-50': '#fef3f2',
	'--ml-red-100': '#fee4e2',
	'--ml-red-200': '#fecdca',
	'--ml-red-300': '#fda29b',
	'--ml-red-400': '#f97066',
	'--ml-red-500': '#f04438',
	'--ml-red-600': '#d92d20',
	'--ml-red-700': '#b42318',
	'--ml-red-800': '#912018',
	'--ml-red-900': '#7a271a',
	'--ml-red-950': '#55160c',

	// Amber/Warning - Warm and attention-grabbing
	'--ml-amber-25': '#fffcf5',
	'--ml-amber-50': '#fffaeb',
	'--ml-amber-100': '#fef0c7',
	'--ml-amber-200': '#fedf89',
	'--ml-amber-300': '#fec84b',
	'--ml-amber-400': '#fdb022',
	'--ml-amber-500': '#f79009',
	'--ml-amber-600': '#dc6803',
	'--ml-amber-700': '#b54708',
	'--ml-amber-800': '#93370d',
	'--ml-amber-900': '#7a2e0e',
	'--ml-amber-950': '#4e1d09',

	// Cyan - Info color, cool and professional
	'--ml-cyan-25': '#f5feff',
	'--ml-cyan-50': '#ecfdff',
	'--ml-cyan-100': '#cff9fe',
	'--ml-cyan-200': '#a5f0fc',
	'--ml-cyan-300': '#67e3f9',
	'--ml-cyan-400': '#22ccee',
	'--ml-cyan-500': '#06aed4',
	'--ml-cyan-600': '#088ab2',
	'--ml-cyan-700': '#0e7090',
	'--ml-cyan-800': '#155b75',
	'--ml-cyan-900': '#164c63',
	'--ml-cyan-950': '#0d2d3a',

	// Purple - Accent color
	'--ml-purple-25': '#fcfaff',
	'--ml-purple-50': '#f9f5ff',
	'--ml-purple-100': '#f4ebff',
	'--ml-purple-200': '#e9d7fe',
	'--ml-purple-300': '#d6bbfb',
	'--ml-purple-400': '#b692f6',
	'--ml-purple-500': '#9e77ed',
	'--ml-purple-600': '#7f56d9',
	'--ml-purple-700': '#6941c6',
	'--ml-purple-800': '#53389e',
	'--ml-purple-900': '#42307d',
	'--ml-purple-950': '#2c1c5f'
} as const;

/**
 * Semantic color tokens - these reference the primitives and provide meaning
 */
export const colorTokens = {
	// Primary brand colors
	'--ml-color-primary': 'var(--ml-blue-600)',
	'--ml-color-primary-hover': 'var(--ml-blue-700)',
	'--ml-color-primary-active': 'var(--ml-blue-800)',
	'--ml-color-primary-subtle': 'var(--ml-blue-50)',

	// Secondary
	'--ml-color-secondary': 'var(--ml-gray-600)',
	'--ml-color-secondary-hover': 'var(--ml-gray-700)',
	'--ml-color-secondary-active': 'var(--ml-gray-800)',
	'--ml-color-secondary-subtle': 'var(--ml-gray-100)',

	// Success
	'--ml-color-success': 'var(--ml-green-600)',
	'--ml-color-success-hover': 'var(--ml-green-700)',
	'--ml-color-success-subtle': 'var(--ml-green-50)',

	// Warning
	'--ml-color-warning': 'var(--ml-amber-500)',
	'--ml-color-warning-hover': 'var(--ml-amber-600)',
	'--ml-color-warning-subtle': 'var(--ml-amber-50)',

	// Danger/Error
	'--ml-color-danger': 'var(--ml-red-600)',
	'--ml-color-danger-hover': 'var(--ml-red-700)',
	'--ml-color-danger-subtle': 'var(--ml-red-50)',

	// Info
	'--ml-color-info': 'var(--ml-cyan-600)',
	'--ml-color-info-hover': 'var(--ml-cyan-700)',
	'--ml-color-info-subtle': 'var(--ml-cyan-50)',

	// Surface colors (backgrounds)
	'--ml-color-background': 'var(--ml-white)',
	'--ml-color-surface': 'var(--ml-white)',
	'--ml-color-surface-raised': 'var(--ml-gray-50)',
	'--ml-color-surface-overlay': 'var(--ml-white)',
	'--ml-color-surface-sunken': 'var(--ml-gray-100)',

	// Text colors
	'--ml-color-text': 'var(--ml-gray-900)',
	'--ml-color-text-secondary': 'var(--ml-gray-700)',
	'--ml-color-text-muted': 'var(--ml-gray-500)',
	'--ml-color-text-subtle': 'var(--ml-gray-400)',
	'--ml-color-text-inverse': 'var(--ml-white)',
	'--ml-color-text-link': 'var(--ml-blue-600)',
	'--ml-color-text-link-hover': 'var(--ml-blue-700)',

	// Border colors
	'--ml-color-border': 'var(--ml-gray-200)',
	'--ml-color-border-strong': 'var(--ml-gray-300)',
	'--ml-color-border-muted': 'var(--ml-gray-100)',
	'--ml-color-border-focus': 'var(--ml-blue-500)',

	// Focus ring
	'--ml-color-focus-ring': 'var(--ml-blue-500)',
	'--ml-focus-ring-width': '4px',
	'--ml-focus-ring-offset': '1px',

	// Component-specific semantic tokens
	'--ml-color-toggle-off': 'var(--ml-gray-200)',
	'--ml-color-toggle-off-hover': 'var(--ml-gray-300)',
	'--ml-color-input-bg': 'var(--ml-white)',
	'--ml-color-input-disabled-bg': 'var(--ml-gray-50)',

	// Badge colors (light mode defaults)
	'--ml-badge-default-bg': 'var(--ml-gray-100)',
	'--ml-badge-default-border': 'var(--ml-gray-200)',
	'--ml-badge-default-text': 'var(--ml-gray-700)',

	'--ml-badge-primary-bg': 'var(--ml-blue-50)',
	'--ml-badge-primary-border': 'var(--ml-blue-200)',
	'--ml-badge-primary-text': 'var(--ml-blue-700)',

	'--ml-badge-success-bg': 'var(--ml-green-50)',
	'--ml-badge-success-border': 'var(--ml-green-200)',
	'--ml-badge-success-text': 'var(--ml-green-700)',

	'--ml-badge-warning-bg': 'var(--ml-amber-50)',
	'--ml-badge-warning-border': 'var(--ml-amber-200)',
	'--ml-badge-warning-text': 'var(--ml-amber-700)',

	'--ml-badge-error-bg': 'var(--ml-red-50)',
	'--ml-badge-error-border': 'var(--ml-red-200)',
	'--ml-badge-error-text': 'var(--ml-red-700)',

	// Alert colors (light mode defaults)
	'--ml-alert-info-bg': 'var(--ml-blue-50)',
	'--ml-alert-info-border': 'var(--ml-blue-200)',
	'--ml-alert-info-text': 'var(--ml-blue-700)',
	'--ml-alert-info-icon': 'var(--ml-blue-600)',

	'--ml-alert-success-bg': 'var(--ml-green-50)',
	'--ml-alert-success-border': 'var(--ml-green-200)',
	'--ml-alert-success-text': 'var(--ml-green-700)',
	'--ml-alert-success-icon': 'var(--ml-green-600)',

	'--ml-alert-warning-bg': 'var(--ml-amber-50)',
	'--ml-alert-warning-border': 'var(--ml-amber-200)',
	'--ml-alert-warning-text': 'var(--ml-amber-700)',
	'--ml-alert-warning-icon': 'var(--ml-amber-600)',

	'--ml-alert-error-bg': 'var(--ml-red-50)',
	'--ml-alert-error-border': 'var(--ml-red-200)',
	'--ml-alert-error-text': 'var(--ml-red-700)',
	'--ml-alert-error-icon': 'var(--ml-red-600)',

	// Tooltip colors
	'--ml-tooltip-bg': 'var(--ml-gray-900)',
	'--ml-tooltip-text': 'var(--ml-white)',

	// Card footer
	'--ml-card-footer-bg': 'var(--ml-gray-50)'
} as const;
