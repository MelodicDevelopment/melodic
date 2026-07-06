import { MelodicComponent } from '@melodicdev/core';
import type { IElementRef, OnCreate } from '@melodicdev/core';
import { cardTemplate } from './card.template.js';
import { cardStyles } from './card.styles.js';

type CardVariant = 'default' | 'outlined' | 'elevated' | 'filled';

/**
 * ml-card - Container component for grouping content
 *
 * @example
 * ```html
 * <ml-card>
 *   <h3 slot="header">Card Title</h3>
 *   <p>Card content goes here</p>
 *   <div slot="footer">Card footer</div>
 * </ml-card>
 * ```
 *
 * @slot header - Card header content
 * @slot default - Main card content
 * @slot footer - Card footer content
 */
@MelodicComponent({
	selector: 'ml-card',
	template: cardTemplate,
	styles: cardStyles,
	attributes: ['variant', 'hoverable', 'clickable']
})
export class CardComponent implements IElementRef, OnCreate {
	public elementRef!: HTMLElement;

	/** Card visual style */
	public variant: CardVariant = 'default';

	/** Add hover effect */
	public hoverable = false;

	/** Make card clickable */
	public clickable = false;

	/** Whether the header slot has content (kept in sync via slotchange) */
	public hasHeader = false;

	/** Whether the footer slot has content (kept in sync via slotchange) */
	public hasFooter = false;

	public onCreate(): void {
		// Slot presence is reactive (profile-card pattern): content added or
		// removed after mount projects correctly instead of being frozen at the
		// value a render-time querySelector saw.
		const shadow = this.elementRef.shadowRoot;
		if (!shadow) return;
		shadow.querySelectorAll('slot[name]').forEach((slot) => {
			slot.addEventListener('slotchange', () => {
				const name = slot.getAttribute('name');
				const hasContent = (slot as HTMLSlotElement).assignedNodes().length > 0;
				if (name === 'header') this.hasHeader = hasContent;
				else if (name === 'footer') this.hasFooter = hasContent;
			});
		});
	}

	public handleClick = (event: MouseEvent): void => {
		if (this.clickable) {
			this.elementRef.dispatchEvent(
				new CustomEvent('ml:click', {
					bubbles: true,
					composed: true,
					detail: { originalEvent: event }
				})
			);
		}
	};
}
