// Component variant types
// The library's canonical destructive/failure variant name is 'error' (used by
// alert, toast, badge, progress). Components that historically used 'danger'
// (button, tag dot color) keep accepting it as a deprecated alias — no hard break.
export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'error' | 'link';
export type AlertVariant = 'info' | 'success' | 'warning' | 'error';
export type BadgeVariant = 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error';

// Size types
/** Full size scale. Only components that actually style all five steps
 * (button, spinner, avatar, file-icon) use this directly. */
export type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
/** The sizes most controls actually style (inputs, toggles, tabs, tags,
 * button groups, …). Kept separate from `Size` so component props no longer
 * promise xs/xl variants that have no styles. */
export type ControlSize = 'sm' | 'md' | 'lg';
export type ComponentSize = Size;

// Placement types for positioning
export type Side = 'top' | 'right' | 'bottom' | 'left';
export type Alignment = 'start' | 'center' | 'end';
export type Placement =
	| 'top'
	| 'top-start'
	| 'top-end'
	| 'bottom'
	| 'bottom-start'
	| 'bottom-end'
	| 'left'
	| 'left-start'
	| 'left-end'
	| 'right'
	| 'right-start'
	| 'right-end';

// Orientation
export type Orientation = 'horizontal' | 'vertical';

// Theme types
export type ThemeMode = 'light' | 'dark' | 'system';
