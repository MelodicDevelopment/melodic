export type TabsVariant = 'line' | 'enclosed' | 'pills';
export type TabsOrientation = 'horizontal' | 'vertical';

export interface TabConfig {
	value: string;
	label: string;
	icon?: string;
	disabled?: boolean;
	href?: string;
}
