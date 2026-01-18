// Component variant types
export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'link';
export type AlertVariant = 'info' | 'success' | 'warning' | 'error';
export type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'error';

// Size types
export type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
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
