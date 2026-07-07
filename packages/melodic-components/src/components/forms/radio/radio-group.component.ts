import { MelodicComponent } from '@melodicdev/core';
import type { IElementRef, OnInit } from '@melodicdev/core';
import { registerAdapter } from '@melodicdev/core/forms';
import type { Orientation } from '../../../types/index.js';
import { radioGroupTemplate } from './radio-group.template.js';
import { radioGroupStyles } from './radio-group.styles.js';

registerAdapter<string>((el) => el.tagName === 'ML-RADIO-GROUP', {
	inputEvent: 'ml:change',
	blurEvent: 'focusout',
	getValue: (el) => (el as unknown as { value: string }).value ?? '',
	setValue: (el, value) => { (el as unknown as { value: string }).value = value !== null && value !== undefined ? String(value) : ''; },
	setDisabled: (el, disabled) => { (el as unknown as { disabled: boolean }).disabled = disabled; }
});

/**
 * ml-radio-group - Container for radio buttons
 *
 * @example
 * ```html
 * <ml-radio-group label="Select option" name="options">
 *   <ml-radio value="a" label="Option A"></ml-radio>
 *   <ml-radio value="b" label="Option B"></ml-radio>
 * </ml-radio-group>
 * ```
 *
 * @fires ml:change - Emitted when selection changes
 */
@MelodicComponent({
	selector: 'ml-radio-group',
	template: radioGroupTemplate,
	styles: radioGroupStyles,
	attributes: ['label', 'name', 'value', 'hint', 'error', 'orientation', 'disabled', 'required']
})
export class RadioGroupComponent implements IElementRef, OnInit {
	public elementRef!: HTMLElement;

	/** Group label */
	public label = '';

	/** Form field name */
	public name = '';

	/** Current selected value */
	public value = '';

	/** Hint text */
	public hint = '';

	/** Error message */
	public error = '';

	/** Layout orientation */
	public orientation: Orientation = 'vertical';

	/** Disabled state */
	public disabled = false;

	/** Required state */
	public required = false;

	public onInit(): void {
		// Listen for changes from child radios
		this.elementRef.addEventListener('ml:change', this.handleChildChange as EventListener);
		// Arrow-key navigation (roving tabindex) — radios live in their own
		// shadow roots so native radio grouping does not apply.
		this.elementRef.addEventListener('keydown', this.handleKeyDown);
	}

	public onCreate(): void {
		// Re-sync when slotted radios are added/removed.
		const slot = this.elementRef.shadowRoot?.querySelector('slot');
		slot?.addEventListener('slotchange', () => this.updateChildRadios());
	}

	public onRender(): void {
		// Sync child radios after every render (post-commit), so programmatic
		// value/disabled changes — e.g. from a :formControl binding, setValue, or
		// reset — are reflected on the slotted radios.
		this.updateChildRadios();
	}

	private handleChildChange = (event: CustomEvent): void => {
		if (event.target === this.elementRef) {
			return;
		}

		// Consume the child radio's event so consumers observe exactly one
		// ml:change per selection (the group's re-emit below).
		event.stopImmediatePropagation();

		const detail = event.detail as { value: string };
		this.value = detail.value;

		// Update checked state on all child radios
		this.updateChildRadios();

		// Re-emit the event
		this.elementRef.dispatchEvent(
			new CustomEvent('ml:change', {
				bubbles: true,
				composed: true,
				detail: { value: this.value }
			})
		);
	};

	/** WAI-ARIA radio group keyboard support: arrows move focus AND selection. */
	private handleKeyDown = (event: KeyboardEvent): void => {
		if (this.disabled) return;

		let direction = 0;
		if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
			direction = 1;
		} else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
			direction = -1;
		} else {
			return;
		}

		const radios = this.getEnabledRadios();
		if (radios.length === 0) return;

		event.preventDefault();

		// Current position: the radio that received the key, falling back to the
		// checked radio, falling back to just before/at the first.
		const originRadio = (event.target as HTMLElement | null)?.closest?.('ml-radio') ?? null;
		let index = originRadio ? radios.indexOf(originRadio) : -1;
		if (index === -1) {
			index = radios.findIndex((radio) => this.getRadioValue(radio) === this.value && this.value !== '');
		}
		if (index === -1) {
			index = direction === 1 ? -1 : 0;
		}

		const next = radios[(index + direction + radios.length) % radios.length];
		this.selectRadio(next);
	};

	private selectRadio(radio: Element): void {
		this.value = this.getRadioValue(radio);
		this.updateChildRadios();
		this.focusRadio(radio);

		this.elementRef.dispatchEvent(
			new CustomEvent('ml:change', {
				bubbles: true,
				composed: true,
				detail: { value: this.value }
			})
		);
	}

	private focusRadio(radio: Element): void {
		const input = radio.shadowRoot?.querySelector('.ml-radio__input') as HTMLElement | null;
		input?.focus();
	}

	private getRadioValue(radio: Element): string {
		return ((radio as any).value as string | undefined) ?? radio.getAttribute('value') ?? '';
	}

	private getEnabledRadios(): Element[] {
		return Array.from(this.elementRef.querySelectorAll('ml-radio')).filter(
			(radio) => (radio as any).disabled !== true && !radio.hasAttribute('disabled')
		);
	}

	private updateChildRadios(): void {
		const radios = this.elementRef.querySelectorAll('ml-radio');
		if (this.value === '') {
			for (const radio of radios) {
				const isChecked = (radio as any).checked === true || radio.hasAttribute('checked');
				if (isChecked) {
					this.value = this.getRadioValue(radio);
					break;
				}
			}
		}

		// Roving tabindex: the checked radio is the single tab stop; when nothing
		// is checked, the first enabled radio takes it.
		let tabbableRadio: Element | null = null;
		if (this.value !== '') {
			tabbableRadio = Array.from(radios).find(
				(radio) => this.getRadioValue(radio) === this.value && (radio as any).disabled !== true && !radio.hasAttribute('disabled')
			) ?? null;
		}
		if (!tabbableRadio) {
			tabbableRadio = this.getEnabledRadios()[0] ?? null;
		}

		radios.forEach((radio) => {
			if (this.name) {
				(radio as any).name = this.name;
			}

			(radio as any).disabled = this.disabled;

			const radioValue = this.getRadioValue(radio);
			(radio as any).checked = this.value !== '' && radioValue === this.value;
			(radio as any).tabbable = radio === tabbableRadio;
		});
	}
}
