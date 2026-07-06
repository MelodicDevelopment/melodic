import { MelodicComponent } from '@melodicdev/core';
import type { IElementRef, OnCreate } from '@melodicdev/core';
import type { Orientation } from '../../../types/index.js';
import { dividerTemplate } from './divider.template.js';
import { dividerStyles } from './divider.styles.js';

/**
 * ml-divider - Visual separator between content
 *
 * @example
 * ```html
 * <ml-divider></ml-divider>
 * <ml-divider orientation="vertical"></ml-divider>
 * <ml-divider>OR</ml-divider>
 * ```
 *
 * @slot default - Optional label text to display in the divider
 */
@MelodicComponent({
	selector: 'ml-divider',
	template: dividerTemplate,
	styles: dividerStyles,
	attributes: ['orientation']
})
export class DividerComponent implements IElementRef, OnCreate {
	public elementRef!: HTMLElement;

	/** Divider orientation */
	public orientation: Orientation = 'horizontal';

	/** Whether there is label content (toggled via slotchange) */
	public hasLabel = false;

	public onCreate(): void {
		const shadow = this.elementRef.shadowRoot;
		if (!shadow) return;

		const slot = shadow.querySelector('slot:not([name])') as HTMLSlotElement | null;
		if (!slot) return;

		const update = (): void => {
			this.hasLabel = slot.assignedNodes().some(
				(node) => node.nodeType === Node.ELEMENT_NODE || (node.textContent ?? '').trim() !== ''
			);
		};

		slot.addEventListener('slotchange', update);
		update();
	}
}
