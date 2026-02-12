import { MelodicComponent } from '@melodicdev/core';
import type { IElementRef, OnCreate, OnDestroy } from '@melodicdev/core';
import { radioCardGroupTemplate } from './radio-card-group.template.js';
import { radioCardGroupStyles } from './radio-card-group.styles.js';

/**
 * ml-radio-card-group - A group of selectable card-style radio options
 *
 * @example
 * ```html
 * <ml-radio-card-group value="basic" label="Select a plan">
 *   <ml-radio-card value="basic" label="Basic" description="Up to 5 users" detail="$10/mo"></ml-radio-card>
 *   <ml-radio-card value="pro" label="Business" description="Up to 50 users" detail="$25/mo"></ml-radio-card>
 * </ml-radio-card-group>
 * ```
 *
 * @fires ml:change - Emitted when selection changes. Detail: { value: string }
 */
@MelodicComponent({
	selector: 'ml-radio-card-group',
	template: radioCardGroupTemplate,
	styles: radioCardGroupStyles,
	attributes: ['value', 'label', 'hint', 'error', 'orientation', 'disabled', 'required']
})
export class RadioCardGroupComponent implements IElementRef, OnCreate, OnDestroy {
	elementRef!: HTMLElement;

	/** Currently selected value */
	value = '';

	/** Group label */
	label = '';

	/** Hint text */
	hint = '';

	/** Error message */
	error = '';

	/** Layout orientation */
	orientation: 'vertical' | 'horizontal' = 'vertical';

	/** Disabled state */
	disabled = false;

	/** Required state */
	required = false;

	onCreate(): void {
		this.elementRef.addEventListener('ml:card-select', this._handleCardSelect as EventListener);
		this.syncCards();
	}

	onDestroy(): void {
		this.elementRef.removeEventListener('ml:card-select', this._handleCardSelect as EventListener);
	}

	handleSlotChange = (): void => {
		this.syncCards();
	};

	private readonly _handleCardSelect = (event: CustomEvent<{ value: string }>): void => {
		event.stopPropagation();
		this.value = event.detail.value;
		this.syncCards();

		this.elementRef.dispatchEvent(
			new CustomEvent('ml:change', {
				bubbles: true,
				composed: true,
				detail: { value: this.value }
			})
		);
	};

	private syncCards(): void {
		const cards = this.elementRef.querySelectorAll('ml-radio-card');

		// If no value set, check for initially-selected card
		if (this.value === '') {
			for (const card of cards) {
				if (card.hasAttribute('selected')) {
					this.value = card.getAttribute('value') ?? '';
					break;
				}
			}
		}

		cards.forEach((card) => {
			const cardValue = card.getAttribute('value') ?? '';
			const isSelected = cardValue === this.value;
			card.toggleAttribute('selected', isSelected);
			card.toggleAttribute('group-disabled', this.disabled);
		});
	}
}
