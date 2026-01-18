/**
 * Primitive color palette - these are the raw color values
 */
export const primitiveColors = {
	// White & Black
	'--ml-white': '#ffffff',
	'--ml-black': '#000000',

	// Gray scale
	'--ml-gray-50': '#f9fafb',
	'--ml-gray-100': '#f3f4f6',
	'--ml-gray-200': '#e5e7eb',
	'--ml-gray-300': '#d1d5db',
	'--ml-gray-400': '#9ca3af',
	'--ml-gray-500': '#6b7280',
	'--ml-gray-600': '#4b5563',
	'--ml-gray-700': '#374151',
	'--ml-gray-800': '#1f2937',
	'--ml-gray-900': '#111827',
	'--ml-gray-950': '#030712',

	// Blue
	'--ml-blue-50': '#eff6ff',
	'--ml-blue-100': '#dbeafe',
	'--ml-blue-200': '#bfdbfe',
	'--ml-blue-300': '#93c5fd',
	'--ml-blue-400': '#60a5fa',
	'--ml-blue-500': '#3b82f6',
	'--ml-blue-600': '#2563eb',
	'--ml-blue-700': '#1d4ed8',
	'--ml-blue-800': '#1e40af',
	'--ml-blue-900': '#1e3a8a',
	'--ml-blue-950': '#172554',

	// Green
	'--ml-green-50': '#f0fdf4',
	'--ml-green-100': '#dcfce7',
	'--ml-green-200': '#bbf7d0',
	'--ml-green-300': '#86efac',
	'--ml-green-400': '#4ade80',
	'--ml-green-500': '#22c55e',
	'--ml-green-600': '#16a34a',
	'--ml-green-700': '#15803d',
	'--ml-green-800': '#166534',
	'--ml-green-900': '#14532d',
	'--ml-green-950': '#052e16',

	// Red
	'--ml-red-50': '#fef2f2',
	'--ml-red-100': '#fee2e2',
	'--ml-red-200': '#fecaca',
	'--ml-red-300': '#fca5a5',
	'--ml-red-400': '#f87171',
	'--ml-red-500': '#ef4444',
	'--ml-red-600': '#dc2626',
	'--ml-red-700': '#b91c1c',
	'--ml-red-800': '#991b1b',
	'--ml-red-900': '#7f1d1d',
	'--ml-red-950': '#450a0a',

	// Amber/Yellow
	'--ml-amber-50': '#fffbeb',
	'--ml-amber-100': '#fef3c7',
	'--ml-amber-200': '#fde68a',
	'--ml-amber-300': '#fcd34d',
	'--ml-amber-400': '#fbbf24',
	'--ml-amber-500': '#f59e0b',
	'--ml-amber-600': '#d97706',
	'--ml-amber-700': '#b45309',
	'--ml-amber-800': '#92400e',
	'--ml-amber-900': '#78350f',
	'--ml-amber-950': '#451a03',

	// Cyan
	'--ml-cyan-50': '#ecfeff',
	'--ml-cyan-100': '#cffafe',
	'--ml-cyan-200': '#a5f3fc',
	'--ml-cyan-300': '#67e8f9',
	'--ml-cyan-400': '#22d3ee',
	'--ml-cyan-500': '#06b6d4',
	'--ml-cyan-600': '#0891b2',
	'--ml-cyan-700': '#0e7490',
	'--ml-cyan-800': '#155e75',
	'--ml-cyan-900': '#164e63',
	'--ml-cyan-950': '#083344',

	// Purple
	'--ml-purple-50': '#faf5ff',
	'--ml-purple-100': '#f3e8ff',
	'--ml-purple-200': '#e9d5ff',
	'--ml-purple-300': '#d8b4fe',
	'--ml-purple-400': '#c084fc',
	'--ml-purple-500': '#a855f7',
	'--ml-purple-600': '#9333ea',
	'--ml-purple-700': '#7e22ce',
	'--ml-purple-800': '#6b21a8',
	'--ml-purple-900': '#581c87',
	'--ml-purple-950': '#3b0764'
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
	'--ml-focus-ring-width': '2px',
	'--ml-focus-ring-offset': '2px'
} as const;
