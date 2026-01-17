import { MelodicComponent, html, css, classMap, when } from '@melodicdev/core';
import type { IElementRef } from '@melodicdev/core';
import type { Size } from '../../../types/index.js';

/**
 * ml-checkbox - Checkbox input component
 *
 * @example
 * ```html
 * <ml-checkbox label="Accept terms"></ml-checkbox>
 * <ml-checkbox label="Subscribe" checked></ml-checkbox>
 * <ml-checkbox label="Indeterminate" indeterminate></ml-checkbox>
 * ```
 *
 * @fires ml-change - Emitted when checked state changes
 */
@MelodicComponent({
	selector: 'ml-checkbox',
	template: (c: Checkbox) => html`
		<label
			class=${classMap({
				'ml-checkbox': true,
				[`ml-checkbox--${c.size}`]: true,
				'ml-checkbox--checked': c.checked,
				'ml-checkbox--indeterminate': c.indeterminate,
				'ml-checkbox--disabled': c.disabled
			})}
		>
			<input
				type="checkbox"
				class="ml-checkbox__input"
				.checked=${c.checked}
				.indeterminate=${c.indeterminate}
				?disabled=${c.disabled}
				@change=${c.handleChange}
			/>
			<span class="ml-checkbox__box">
				${when(
					c.checked && !c.indeterminate,
					() => html`
						<svg class="ml-checkbox__check" viewBox="0 0 12 12" fill="none">
							<path d="M2.5 6L5 8.5L9.5 3.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
						</svg>
					`
				)}
				${when(
					c.indeterminate,
					() => html`
						<svg class="ml-checkbox__minus" viewBox="0 0 12 12" fill="none">
							<path d="M2.5 6H9.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
						</svg>
					`
				)}
			</span>
			${when(!!c.label, () => html`<span class="ml-checkbox__label">${c.label}</span>`)}
		</label>
		${when(!!c.hint, () => html`<span class="ml-checkbox__hint">${c.hint}</span>`)}
	`,
	styles: () => css`
		:host {
			display: block;
		}

		.ml-checkbox {
			display: inline-flex;
			align-items: flex-start;
			gap: var(--ml-space-2);
			cursor: pointer;
			user-select: none;
		}

		.ml-checkbox--disabled {
			opacity: 0.5;
			cursor: not-allowed;
		}

		/* Hidden native checkbox */
		.ml-checkbox__input {
			position: absolute;
			opacity: 0;
			width: 0;
			height: 0;
		}

		/* Custom checkbox box */
		.ml-checkbox__box {
			flex-shrink: 0;
			display: flex;
			align-items: center;
			justify-content: center;
			background-color: var(--ml-color-surface);
			border: var(--ml-border-2) solid var(--ml-color-border-strong);
			border-radius: var(--ml-radius-sm);
			color: var(--ml-color-text-inverse);
			transition:
				background-color var(--ml-duration-150) var(--ml-ease-in-out),
				border-color var(--ml-duration-150) var(--ml-ease-in-out);
		}

		.ml-checkbox__input:focus-visible + .ml-checkbox__box {
			outline: var(--ml-focus-ring-width) solid var(--ml-color-focus-ring);
			outline-offset: var(--ml-focus-ring-offset);
		}

		.ml-checkbox--checked .ml-checkbox__box,
		.ml-checkbox--indeterminate .ml-checkbox__box {
			background-color: var(--ml-color-primary);
			border-color: var(--ml-color-primary);
		}

		.ml-checkbox:hover:not(.ml-checkbox--disabled) .ml-checkbox__box {
			border-color: var(--ml-color-primary);
		}

		/* Sizes */
		.ml-checkbox--sm .ml-checkbox__box {
			width: 1rem;
			height: 1rem;
		}

		.ml-checkbox--md .ml-checkbox__box {
			width: 1.25rem;
			height: 1.25rem;
		}

		.ml-checkbox--lg .ml-checkbox__box {
			width: 1.5rem;
			height: 1.5rem;
		}

		/* Check/minus icons */
		.ml-checkbox__check,
		.ml-checkbox__minus {
			width: 75%;
			height: 75%;
		}

		/* Label */
		.ml-checkbox__label {
			font-size: var(--ml-text-sm);
			color: var(--ml-color-text);
			line-height: 1.25rem;
		}

		.ml-checkbox--lg .ml-checkbox__label {
			font-size: var(--ml-text-base);
			line-height: 1.5rem;
		}

		/* Hint */
		.ml-checkbox__hint {
			display: block;
			margin-top: var(--ml-space-1);
			margin-left: calc(1.25rem + var(--ml-space-2));
			font-size: var(--ml-text-sm);
			color: var(--ml-color-text-muted);
		}

		.ml-checkbox--lg + .ml-checkbox__hint {
			margin-left: calc(1.5rem + var(--ml-space-2));
		}
	`,
	attributes: ['label', 'hint', 'size', 'checked', 'indeterminate', 'disabled']
})
export class Checkbox implements IElementRef {
	elementRef!: HTMLElement;

	/** Checkbox label */
	label = '';

	/** Hint text below the checkbox */
	hint = '';

	/** Checkbox size */
	size: Size = 'md';

	/** Checked state */
	checked = false;

	/** Indeterminate state */
	indeterminate = false;

	/** Disabled state */
	disabled = false;

	handleChange = (event: Event): void => {
		const target = event.target as HTMLInputElement;
		this.checked = target.checked;
		this.indeterminate = false;

		this.elementRef.dispatchEvent(
			new CustomEvent('ml-change', {
				bubbles: true,
				composed: true,
				detail: { checked: this.checked }
			})
		);
	};
}
