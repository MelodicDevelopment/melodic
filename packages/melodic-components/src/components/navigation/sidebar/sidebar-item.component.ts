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
	attributes: ['icon', 'icon-format', 'label', 'value', 'href', 'active', 'disabled', 'badge', 'badge-color', 'external', 'expanded', 'collapsed', 'level']
})
export class SidebarItemComponent implements IElementRef, OnCreate, OnDestroy {
	public elementRef!: HTMLElement;

	/** Icon name */
	public icon = '';

	/** Icon format (passed through to ml-icon) */
	public 'icon-format': 'fill' | 'thin' | 'light' | 'regular' | 'bold' | '' = '';

	/** Display label */
	public label = '';

	/** Unique value identifier */
	public value = '';

	/** Navigation URL */
	public href = '';

	/** Active state (managed by parent sidebar) */
	public active = false;

	/** Disabled state */
	public disabled = false;

	/** Badge text */
	public badge = '';

	/** Badge color variant */
	public 'badge-color': BadgeColor = 'default';

	/** External link */
	public external = false;

	/** Submenu expanded state */
	public expanded = false;

	/** Collapsed state (set by parent sidebar in slim mode) */
	public collapsed = false;

	/** Indentation level for nested items */
	public level = '0';

	/** Track slotted children */
	private _hasChildren = false;

	/** Check if default slot has children */
	public get hasChildren(): boolean {
		return this._hasChildren;
	}

	public onCreate(): void {
		// Check for slotted children
		this._hasChildren = this.elementRef.querySelector('ml-sidebar-item') !== null;
	}

	public onDestroy(): void {
		// cleanup if needed
	}

	/** Handle default slot change to detect children */
	public handleSlotChange = (event: Event): void => {
		const slot = event.target as HTMLSlotElement;
		const assigned = slot.assignedElements({ flatten: true });
		this._hasChildren = assigned.some((el) => el.tagName === 'ML-SIDEBAR-ITEM');
	};

	/** Handle click on item */
	public handleClick = (event: Event): void => {
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
