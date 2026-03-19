import { MelodicComponent } from '@melodicdev/core';
import type { IElementRef } from '@melodicdev/core';
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
export class CardComponent implements IElementRef {
	public elementRef!: HTMLElement;

	/** Card visual style */
	public variant: CardVariant = 'default';

	/** Add hover effect */
	public hoverable = false;

	/** Make card clickable */
	public clickable = false;

	/** Internal: check if header slot has content */
	public get hasHeader(): boolean {
		return this.elementRef?.querySelector('[slot="header"]') !== null;
	}

	/** Internal: check if footer slot has content */
	public get hasFooter(): boolean {
		return this.elementRef?.querySelector('[slot="footer"]') !== null;
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
