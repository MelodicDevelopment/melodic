export type SidebarVariant = 'default' | 'slim';
export type BadgeColor = 'default' | 'primary' | 'success' | 'warning' | 'error';

export interface SidebarNavItem {
	value: string;
	label: string;
	icon?: string;
	href?: string;
	badge?: string;
	badgeColor?: BadgeColor;
	external?: boolean;
	disabled?: boolean;
	children?: SidebarNavItem[];
}

export interface SidebarNavGroup {
	label?: string;
	items: SidebarNavItem[];
}
