import { MelodicComponent } from '@melodicdev/core';
import type { IElementRef, OnCreate, OnDestroy } from '@melodicdev/core';
import { registerAdapter } from '@melodicdev/core/forms';
import { radioCardGroupTemplate } from './radio-card-group.template.js';
import { radioCardGroupStyles } from './radio-card-group.styles.js';

registerAdapter<string>((el) => el.tagName === 'ML-RADIO-CARD-GROUP', {
	inputEvent: 'ml:change',
	blurEvent: 'focusout',
	getValue: (el) => (el as unknown as { value: string }).value ?? '',
	setValue: (el, value) => { (el as unknown as { value: string }).value = value !== null && value !== undefined ? String(value) : ''; },
	setDisabled: (el, disabled) => { (el as unknown as { disabled: boolean }).disabled = disabled; }
});

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
	public elementRef!: HTMLElement;

	/** Currently selected value */
	public value = '';

	/** Group label */
	public label = '';

	/** Hint text */
	public hint = '';

	/** Error message */
	public error = '';

	/** Layout orientation */
	public orientation: 'vertical' | 'horizontal' = 'vertical';

	/** Disabled state */
	public disabled = false;

	/** Required state */
	public required = false;

	public onCreate(): void {
		this.elementRef.addEventListener('ml:card-select', this._handleCardSelect as EventListener);
		this.elementRef.addEventListener('keydown', this._handleKeyDown);
		// Re-sync when slotted cards are added/removed.
		this.elementRef.shadowRoot?.querySelector('slot')?.addEventListener('slotchange', this.handleSlotChange);
	}

	public onRender(): void {
		// Sync cards after every render (post-commit), so programmatic value/
		// disabled changes — e.g. from a :formControl binding, setValue, or reset —
		// are reflected on the slotted cards.
		this.syncCards();
	}

	public onDestroy(): void {
		this.elementRef.removeEventListener('ml:card-select', this._handleCardSelect as EventListener);
		this.elementRef.removeEventListener('keydown', this._handleKeyDown);
	}

	/**
	 * Arrow-key navigation across the group, as the radio pattern requires.
	 * Cards live in their own shadow roots, so native radio grouping does not
	 * apply and this has to be done by hand (mirrors ml-radio-group).
	 */
	private readonly _handleKeyDown = (event: KeyboardEvent): void => {
		const keys = ['ArrowDown', 'ArrowRight', 'ArrowUp', 'ArrowLeft'];
		if (!keys.includes(event.key)) {
			return;
		}

		const cards = [...this.elementRef.querySelectorAll('ml-radio-card')].filter(
			(card) => !card.hasAttribute('disabled') && !card.hasAttribute('group-disabled')
		);
		if (cards.length === 0) {
			return;
		}

		const currentIndex = Math.max(
			0,
			cards.findIndex((card) => (card.getAttribute('value') ?? '') === this.value)
		);
		const forward = event.key === 'ArrowDown' || event.key === 'ArrowRight';
		const next = cards[(currentIndex + (forward ? 1 : -1) + cards.length) % cards.length];

		event.preventDefault();
		this.value = next.getAttribute('value') ?? '';
		this.syncCards();
		(next as HTMLElement).focus();

		this.elementRef.dispatchEvent(
			new CustomEvent('ml:change', {
				bubbles: true,
				composed: true,
				detail: { value: this.value }
			})
		);
	};

	public handleSlotChange = (): void => {
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

		// The tab stop is the selected card, or the first enabled one when
		// nothing is selected yet — one stop for the whole group.
		const enabled = [...cards].filter((card) => !card.hasAttribute('disabled'));
		const tabStopCard = enabled.find((card) => (card.getAttribute('value') ?? '') === this.value) ?? enabled[0];

		cards.forEach((card) => {
			const cardValue = card.getAttribute('value') ?? '';
			const isSelected = cardValue === this.value;
			card.toggleAttribute('selected', isSelected);
			card.toggleAttribute('group-disabled', this.disabled);
			card.toggleAttribute('tab-stop', card === tabStopCard);
		});
	}
}
