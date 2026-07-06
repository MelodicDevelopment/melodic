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
	public elementRef!: HTMLElement;

	/** Visual variant */
	public variant: SidebarVariant = 'default';

	/** Currently active item value */
	public active = '';

	/** Collapsed state (controlled by slim variant hover) */
	public collapsed = false;

	/** Navigation config (alternative to slotted content) */
	public navigation: SidebarNavGroup[] = [];

	/** Footer navigation config */
	public footerNavigation: SidebarNavItem[] = [];

	/** Debounce timer for hover */
	private _hoverTimer: ReturnType<typeof setTimeout> | null = null;

	/** Bound event handlers */
	private readonly _handleItemClick = this.onItemClick.bind(this);
	private readonly _handleMouseEnter = this.onMouseEnter.bind(this);
	private readonly _handleMouseLeave = this.onMouseLeave.bind(this);

	/** Check if search slot has content */
	public get hasSearch(): boolean {
		return this.elementRef?.querySelector('[slot="search"]') !== null;
	}

	/** Check if feature slot has content */
	public get hasFeature(): boolean {
		return this.elementRef?.querySelector('[slot="feature"]') !== null;
	}

	/** Check if user slot has content */
	public get hasUser(): boolean {
		return this.elementRef?.querySelector('[slot="user"]') !== null;
	}

	public onCreate(): void {
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

	public onRender(): void {
		this.updateItemStates();
	}

	public onDestroy(): void {
		this.elementRef.removeEventListener('ml:sidebar-item-click', this._handleItemClick as EventListener);
		this.elementRef.removeEventListener('mouseenter', this._handleMouseEnter);
		this.elementRef.removeEventListener('mouseleave', this._handleMouseLeave);

		if (this._hoverTimer) {
			clearTimeout(this._hoverTimer);
		}
	}

	/** Handle slotted items change */
	public handleDefaultSlotChange = (): void => {
		this.updateItemStates();
	};

	/** Handle config item click */
	public handleConfigItemClick = (value: string, href?: string): void => {
		this.activateItem(value, href);
	};

	/** Handle config submenu toggle */
	public handleConfigToggle = (item: SidebarNavItem): void => {
		const next = new Set(this.expandedItems);
		if (next.has(item.value)) {
			next.delete(item.value);
		} else {
			next.add(item.value);
		}
		this.expandedItems = next;
	};

	/** Keyboard navigation */
	public handleKeyDown = (event: KeyboardEvent): void => {
		const focusable = this.getFocusableItems();
		if (focusable.length === 0) return;

		// Keydown events from inside a slotted ml-sidebar-item's shadow root are
		// retargeted to the item HOST by the time they reach our listener, so
		// match against either the focusable element or its host.
		const target = event.target as HTMLElement;
		const currentIndex = focusable.findIndex((entry) => entry.el === target || entry.host === target);

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
			focusable[newIndex].el.focus();
		}
	};

	/**
	 * Focusable navigation targets in visual order: config-mode links rendered
	 * in our shadow root AND the links inside slotted ml-sidebar-item shadow
	 * roots (slotted items previously never received keyboard focus — arrows
	 * changed nothing because the shadow query couldn't see them).
	 */
	private getFocusableItems(): Array<{ el: HTMLElement; host: HTMLElement | null }> {
		const main = this.elementRef.shadowRoot?.querySelector('.ml-sidebar__main');
		if (!main) return [];

		const result: Array<{ el: HTMLElement; host: HTMLElement | null }> = [];

		const visit = (node: Element): void => {
			if (node instanceof HTMLSlotElement) {
				node.assignedElements({ flatten: true }).forEach(visit);
				return;
			}

			if (node.tagName === 'ML-SIDEBAR-ITEM') {
				const link = node.shadowRoot?.querySelector<HTMLElement>('.ml-sidebar-item__link');
				if (link && !link.hasAttribute('disabled') && !link.classList.contains('ml-sidebar-item__link--disabled')) {
					result.push({ el: link, host: node as HTMLElement });
				}
				// Submenu items are light-DOM children; only reachable when expanded.
				if (node.hasAttribute('expanded') && !this.collapsed) {
					Array.from(node.children).forEach(visit);
				}
				return;
			}

			if (
				node.matches(
					'.ml-sidebar__item-link:not([disabled]):not(.ml-sidebar__item-link--disabled), button:not([disabled]), a'
				)
			) {
				result.push({ el: node as HTMLElement, host: null });
				return;
			}

			Array.from(node.children).forEach(visit);
		};

		Array.from(main.children).forEach(visit);

		return result;
	}

	/** Track expanded config items */
	public expandedItems = new Set<string>();

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
