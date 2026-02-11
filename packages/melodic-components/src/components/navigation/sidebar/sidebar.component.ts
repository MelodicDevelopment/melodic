import { MelodicComponent } from '@melodicdev/core';
import type { IElementRef, OnCreate, OnDestroy, OnRender } from '@melodicdev/core';
import type { SidebarVariant, SidebarNavGroup, SidebarNavItem } from './sidebar.types.js';
import { sidebarTemplate } from './sidebar.template.js';
import { sidebarStyles } from './sidebar.styles.js';

/**
 * ml-sidebar - App-level sidebar navigation component
 *
 * @example Slotted mode:
 * ```html
 * <ml-sidebar active="home">
 *   <div slot="header">Logo</div>
 *   <ml-sidebar-group label="GENERAL">
 *     <ml-sidebar-item icon="house" label="Home" value="home"></ml-sidebar-item>
 *   </ml-sidebar-group>
 * </ml-sidebar>
 * ```
 *
 * @example Config mode:
 * ```html
 * <ml-sidebar active="home" .navigation=${navGroups}></ml-sidebar>
 * ```
 *
 * @slot header - Logo/branding area
 * @slot search - Search input area
 * @slot default - Navigation content (groups and items)
 * @slot footer-nav - Footer navigation items
 * @slot feature - Feature promotion card
 * @slot user - User profile area
 *
 * @fires ml:change - Emitted when active item changes
 * @fires ml:item-click - Emitted when any item is clicked
 */
@MelodicComponent({
	selector: 'ml-sidebar',
	template: sidebarTemplate,
	styles: sidebarStyles,
	attributes: ['variant', 'active']
})
export class SidebarComponent implements IElementRef, OnCreate, OnDestroy, OnRender {
	elementRef!: HTMLElement;

	/** Visual variant */
	variant: SidebarVariant = 'default';

	/** Currently active item value */
	active = '';

	/** Collapsed state (controlled by slim variant hover) */
	collapsed = false;

	/** Navigation config (alternative to slotted content) */
	navigation: SidebarNavGroup[] = [];

	/** Footer navigation config */
	footerNavigation: SidebarNavItem[] = [];

	/** Internal tracking of slotted items */
	_slottedItems: HTMLElement[] = [];

	/** Debounce timer for hover */
	private _hoverTimer: ReturnType<typeof setTimeout> | null = null;

	/** Bound event handlers */
	private readonly _handleItemClick = this.onItemClick.bind(this);
	private readonly _handleMouseEnter = this.onMouseEnter.bind(this);
	private readonly _handleMouseLeave = this.onMouseLeave.bind(this);

	/** Check if search slot has content */
	get hasSearch(): boolean {
		return this.elementRef?.querySelector('[slot="search"]') !== null;
	}

	/** Check if feature slot has content */
	get hasFeature(): boolean {
		return this.elementRef?.querySelector('[slot="feature"]') !== null;
	}

	/** Check if user slot has content */
	get hasUser(): boolean {
		return this.elementRef?.querySelector('[slot="user"]') !== null;
	}

	onCreate(): void {
		// Set initial collapsed state based on variant
		if (this.variant === 'slim') {
			this.collapsed = true;
		}

		// Listen for item click events from children
		this.elementRef.addEventListener('ml:sidebar-item-click', this._handleItemClick as EventListener);

		// Set up hover for slim variant
		if (this.variant === 'slim') {
			this.elementRef.addEventListener('mouseenter', this._handleMouseEnter);
			this.elementRef.addEventListener('mouseleave', this._handleMouseLeave);
		}
	}

	onRender(): void {
		this.updateItemStates();
	}

	onDestroy(): void {
		this.elementRef.removeEventListener('ml:sidebar-item-click', this._handleItemClick as EventListener);
		this.elementRef.removeEventListener('mouseenter', this._handleMouseEnter);
		this.elementRef.removeEventListener('mouseleave', this._handleMouseLeave);

		if (this._hoverTimer) {
			clearTimeout(this._hoverTimer);
		}
	}

	/** Handle slotted items change */
	handleDefaultSlotChange = (event: Event): void => {
		const slot = event.target as HTMLSlotElement;
		this._slottedItems = slot.assignedElements({ flatten: true }) as HTMLElement[];
		this.updateItemStates();
	};

	/** Handle config item click */
	handleConfigItemClick = (value: string, href?: string): void => {
		this.activateItem(value, href);
	};

	/** Handle config submenu toggle */
	handleConfigToggle = (item: SidebarNavItem, expandedItems: Set<string>): void => {
		if (expandedItems.has(item.value)) {
			expandedItems.delete(item.value);
		} else {
			expandedItems.add(item.value);
		}
		// Trigger re-render
		this.elementRef.dispatchEvent(new Event('ml:internal-update'));
	};

	/** Keyboard navigation */
	handleKeyDown = (event: KeyboardEvent): void => {
		const sidebar = this.elementRef.shadowRoot?.querySelector('.ml-sidebar__main');
		if (!sidebar) return;

		const focusable = Array.from(
			sidebar.querySelectorAll<HTMLElement>('.ml-sidebar__item-link:not([disabled]), button:not([disabled]), a')
		);
		const currentIndex = focusable.indexOf(event.target as HTMLElement);

		let newIndex = currentIndex;

		switch (event.key) {
			case 'ArrowUp':
				event.preventDefault();
				newIndex = currentIndex > 0 ? currentIndex - 1 : focusable.length - 1;
				break;
			case 'ArrowDown':
				event.preventDefault();
				newIndex = currentIndex < focusable.length - 1 ? currentIndex + 1 : 0;
				break;
			case 'Home':
				event.preventDefault();
				newIndex = 0;
				break;
			case 'End':
				event.preventDefault();
				newIndex = focusable.length - 1;
				break;
			default:
				return;
		}

		if (newIndex !== currentIndex && focusable[newIndex]) {
			focusable[newIndex].focus();
		}
	};

	/** Track expanded config items */
	_expandedItems = new Set<string>();

	/** Activate an item */
	private activateItem(value: string, href?: string): void {
		this.active = value;
		this.updateItemStates();

		this.elementRef.dispatchEvent(
			new CustomEvent('ml:change', {
				bubbles: true,
				composed: true,
				detail: { value }
			})
		);

		this.elementRef.dispatchEvent(
			new CustomEvent('ml:item-click', {
				bubbles: true,
				composed: true,
				detail: { value, href }
			})
		);
	}

	/** Handle item click from slotted children */
	private onItemClick(event: CustomEvent): void {
		const { value, href } = event.detail;
		this.activateItem(value, href);
	}

	/** Handle mouse enter for slim variant */
	private onMouseEnter(): void {
		if (this.variant !== 'slim') return;
		if (this._hoverTimer) clearTimeout(this._hoverTimer);
		this._hoverTimer = setTimeout(() => {
			this.collapsed = false;
			this.updateItemStates();
		}, 150);
	}

	/** Handle mouse leave for slim variant */
	private onMouseLeave(): void {
		if (this.variant !== 'slim') return;
		if (this._hoverTimer) clearTimeout(this._hoverTimer);
		this._hoverTimer = setTimeout(() => {
			this.collapsed = true;
			this.updateItemStates();
		}, 150);
	}

	/** Propagate active/collapsed state to slotted children */
	private updateItemStates(): void {
		// Update slotted sidebar items
		const items = this.elementRef.querySelectorAll('ml-sidebar-item');
		items.forEach((item) => {
			const value = item.getAttribute('value') || '';
			item.toggleAttribute('active', value === this.active);
			item.toggleAttribute('collapsed', this.collapsed);
		});

		// Update slotted sidebar groups
		const groups = this.elementRef.querySelectorAll('ml-sidebar-group');
		groups.forEach((group) => {
			group.toggleAttribute('collapsed', this.collapsed);
		});
	}
}
