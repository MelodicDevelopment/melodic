import { MelodicComponent, html, css, classMap, when } from '@melodicdev/core';
import type { IElementRef, OnInit } from '@melodicdev/core';
import type { Orientation } from '../../../types/index.js';

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
 * @fires ml-change - Emitted when selection changes
 */
@MelodicComponent({
	selector: 'ml-radio-group',
	template: (c: RadioGroup) => html`
		<fieldset
			class=${classMap({
				'ml-radio-group': true,
				[`ml-radio-group--${c.orientation}`]: true,
				'ml-radio-group--disabled': c.disabled,
				'ml-radio-group--error': !!c.error
			})}
			role="radiogroup"
			aria-labelledby=${c.label ? 'legend' : ''}
		>
			${when(
				!!c.label,
				() => html`
					<legend id="legend" class="ml-radio-group__legend">
						${c.label}
						${when(c.required, () => html`<span class="ml-radio-group__required">*</span>`)}
					</legend>
				`
			)}

			<div class="ml-radio-group__options">
				<slot></slot>
			</div>

			${when(
				!!c.error,
				() => html`<span class="ml-radio-group__error">${c.error}</span>`,
				() => html`${when(!!c.hint, () => html`<span class="ml-radio-group__hint">${c.hint}</span>`)}`
			)}
		</fieldset>
	`,
	styles: () => css`
		:host {
			display: block;
		}

		.ml-radio-group {
			border: none;
			padding: 0;
			margin: 0;
		}

		.ml-radio-group__legend {
			font-size: var(--ml-text-sm);
			font-weight: var(--ml-font-medium);
			color: var(--ml-color-text);
			margin-bottom: var(--ml-space-2);
		}

		.ml-radio-group__required {
			color: var(--ml-color-danger);
			margin-left: var(--ml-space-0.5);
		}

		/* Options container */
		.ml-radio-group__options {
			display: flex;
			flex-direction: column;
			gap: var(--ml-space-2);
		}

		.ml-radio-group--horizontal .ml-radio-group__options {
			flex-direction: row;
			flex-wrap: wrap;
			gap: var(--ml-space-4);
		}

		/* Disabled state */
		.ml-radio-group--disabled {
			opacity: 0.5;
			pointer-events: none;
		}

		/* Hint & Error */
		.ml-radio-group__hint,
		.ml-radio-group__error {
			display: block;
			margin-top: var(--ml-space-2);
			font-size: var(--ml-text-sm);
		}

		.ml-radio-group__hint {
			color: var(--ml-color-text-muted);
		}

		.ml-radio-group__error {
			color: var(--ml-color-danger);
		}
	`,
	attributes: ['label', 'name', 'value', 'hint', 'error', 'orientation', 'disabled', 'required']
})
export class RadioGroup implements IElementRef, OnInit {
	elementRef!: HTMLElement;

	/** Group label */
	label = '';

	/** Form field name */
	name = '';

	/** Current selected value */
	value = '';

	/** Hint text */
	hint = '';

	/** Error message */
	error = '';

	/** Layout orientation */
	orientation: Orientation = 'vertical';

	/** Disabled state */
	disabled = false;

	/** Required state */
	required = false;

	onInit(): void {
		// Listen for changes from child radios
		this.elementRef.addEventListener('ml-change', this.handleChildChange as EventListener);

		// Set initial name on child radios
		this.updateChildRadios();
	}

	private handleChildChange = (event: CustomEvent): void => {
		if (event.target === this.elementRef) {
			return;
		}

		const detail = event.detail as { value: string };
		this.value = detail.value;

		// Update checked state on all child radios
		this.updateChildRadios();

		// Re-emit the event
		this.elementRef.dispatchEvent(
			new CustomEvent('ml-change', {
				bubbles: true,
				composed: true,
				detail: { value: this.value }
			})
		);
	};

	private updateChildRadios(): void {
		const radios = this.elementRef.querySelectorAll('ml-radio');
		if (this.value === '') {
			for (const radio of radios) {
				const isChecked = (radio as any).checked === true || radio.hasAttribute('checked');
				if (isChecked) {
					this.value = (radio as any).value ?? radio.getAttribute('value') ?? '';
					break;
				}
			}
		}

		radios.forEach((radio) => {
			if (this.name) {
				(radio as any).name = this.name;
			}

			(radio as any).disabled = this.disabled;

			const radioValue = (radio as any).value ?? radio.getAttribute('value') ?? '';
			(radio as any).checked = this.value !== '' && radioValue === this.value;
		});
	}
}
