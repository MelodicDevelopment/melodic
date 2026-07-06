import { MelodicComponent } from '@melodicdev/core';
import type { IElementRef, OnCreate, OnRender } from '@melodicdev/core';
import { listItemTemplate } from './list-item.template.js';
import { listItemStyles } from './list-item.styles.js';

/**
 * ml-list-item - Individual item within a list
 *
 * @example
 * ```html
 * <ml-list-item primary="Phoenix Baker" secondary="Member since Feb 2025">
 *   <ml-avatar slot="leading" initials="PB"></ml-avatar>
 *   <ml-badge slot="trailing" variant="pill" color="success">Active</ml-badge>
 * </ml-list-item>
 * ```
 *
 * @slot leading - Left side content (avatars, icons, images)
 * @slot default - Main content (overrides primary/secondary text)
 * @slot trailing - Right side content (badges, indicators, actions)
 */
@MelodicComponent({
	selector: 'ml-list-item',
	template: listItemTemplate,
	styles: listItemStyles,
	attributes: ['primary', 'secondary', 'disabled', 'interactive']
})
export class ListItemComponent implements IElementRef, OnCreate, OnRender {
	public elementRef!: HTMLElement;

	/** Primary text */
	public primary = '';

	/** Secondary text */
	public secondary = '';

	/** Disable the item */
	public disabled = false;

	/** Enable hover/focus states for clickable items */
	public interactive = false;

	/** Whether the leading slot has content (kept in sync via slotchange) */
	public hasLeadingSlot = false;

	/** Whether the trailing slot has content (kept in sync via slotchange) */
	public hasTrailingSlot = false;

	public onCreate(): void {
		const shadow = this.elementRef.shadowRoot;
		if (shadow) {
			// Slot presence is reactive: content added/removed after mount projects
			// correctly instead of being frozen at first render.
			shadow.querySelectorAll('slot[name]').forEach((slot) => {
				slot.addEventListener('slotchange', () => {
					const name = slot.getAttribute('name');
					const hasContent = (slot as HTMLSlotElement).assignedNodes().length > 0;
					if (name === 'leading') this.hasLeadingSlot = hasContent;
					else if (name === 'trailing') this.hasTrailingSlot = hasContent;
				});
			});
		}

		// Keyboard activation for interactive items: Enter/Space trigger the same
		// click consumers already listen for on the host.
		this.elementRef.addEventListener('keydown', this._handleKeyDown);

		this.syncHostA11y();
	}

	public onRender(): void {
		this.syncHostA11y();
	}

	private readonly _handleKeyDown = (event: KeyboardEvent): void => {
		if (!this.interactive || this.disabled) return;
		if (event.target !== this.elementRef) return;
		if (event.key !== 'Enter' && event.key !== ' ') return;

		event.preventDefault();
		this.elementRef.click();
	};

	/**
	 * Reflect interactive semantics onto the host: without a tabindex/role the
	 * `:host([interactive]:focus-visible)` styling is dead and keyboard users
	 * can never reach a clickable item.
	 */
	private syncHostA11y(): void {
		const host = this.elementRef;

		if (this.interactive) {
			host.setAttribute('role', 'button');
			if (this.disabled) {
				host.removeAttribute('tabindex');
				host.setAttribute('aria-disabled', 'true');
			} else {
				host.setAttribute('tabindex', '0');
				host.removeAttribute('aria-disabled');
			}
		} else {
			host.setAttribute('role', 'listitem');
			host.removeAttribute('tabindex');
			host.removeAttribute('aria-disabled');
		}
	}
}
