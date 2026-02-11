import { MelodicComponent } from '@melodicdev/core';
import type { IElementRef, OnCreate, OnDestroy } from '@melodicdev/core';
import type { BadgeColor } from './sidebar.types.js';
import { sidebarItemTemplate } from './sidebar-item.template.js';
import { sidebarItemStyles } from './sidebar-item.styles.js';

/**
 * ml-sidebar-item - Navigation link for use within ml-sidebar
 *
 * @example
 * ```html
 * <ml-sidebar-item icon="house" label="Home" value="home" active></ml-sidebar-item>
 * <ml-sidebar-item icon="folder" label="Projects" value="projects" badge="5">
 *   <ml-sidebar-item label="Active" value="active" level="1"></ml-sidebar-item>
 *   <ml-sidebar-item label="Archived" value="archived" level="1"></ml-sidebar-item>
 * </ml-sidebar-item>
 * ```
 *
 * @slot leading - Custom icon/avatar override
 * @slot trailing - Custom trailing content
 * @slot default - Sub-items for expandable menu
 *
 * @fires ml:sidebar-item-click - Emitted when item is clicked (bubbles to parent sidebar)
 */
@MelodicComponent({
	selector: 'ml-sidebar-item',
	template: sidebarItemTemplate,
	styles: sidebarItemStyles,
	attributes: ['icon', 'label', 'value', 'href', 'active', 'disabled', 'badge', 'badge-color', 'external', 'expanded', 'collapsed', 'level']
})
export class SidebarItemComponent implements IElementRef, OnCreate, OnDestroy {
	elementRef!: HTMLElement;

	/** Icon name */
	icon = '';

	/** Display label */
	label = '';

	/** Unique value identifier */
	value = '';

	/** Navigation URL */
	href = '';

	/** Active state (managed by parent sidebar) */
	active = false;

	/** Disabled state */
	disabled = false;

	/** Badge text */
	badge = '';

	/** Badge color variant */
	'badge-color': BadgeColor = 'default';

	/** External link */
	external = false;

	/** Submenu expanded state */
	expanded = false;

	/** Collapsed state (set by parent sidebar in slim mode) */
	collapsed = false;

	/** Indentation level for nested items */
	level = '0';

	/** Track slotted children */
	_hasChildren = false;

	/** Check if default slot has children */
	get hasChildren(): boolean {
		return this._hasChildren;
	}

	onCreate(): void {
		// Check for slotted children
		this._hasChildren = this.elementRef.querySelector('ml-sidebar-item') !== null;
	}

	onDestroy(): void {
		// cleanup if needed
	}

	/** Handle default slot change to detect children */
	handleSlotChange = (event: Event): void => {
		const slot = event.target as HTMLSlotElement;
		const assigned = slot.assignedElements({ flatten: true });
		this._hasChildren = assigned.some((el) => el.tagName === 'ML-SIDEBAR-ITEM');
	};

	/** Handle click on item */
	handleClick = (event: Event): void => {
		if (this.disabled) return;

		if (this.hasChildren) {
			event.preventDefault();
			this.expanded = !this.expanded;
			this.elementRef.toggleAttribute('expanded', this.expanded);
			return;
		}

		this.elementRef.dispatchEvent(
			new CustomEvent('ml:sidebar-item-click', {
				bubbles: true,
				composed: true,
				detail: { value: this.value, href: this.href }
			})
		);
	};
}
