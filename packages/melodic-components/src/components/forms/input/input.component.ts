import { MelodicComponent, html, css, classMap, when } from '@melodicdev/core';
import type { IElementRef, OnInit } from '@melodicdev/core';
import type { Size } from '../../../types/index.js';
import type { InputType } from './input.types.js';

/**
 * ml-input - Text input component with label, hint, and error states
 *
 * @example
 * ```html
 * <ml-input label="Email" type="email" placeholder="Enter email"></ml-input>
 * <ml-input label="Password" type="password" required></ml-input>
 * <ml-input label="Name" hint="Enter your full name"></ml-input>
 * <ml-input label="Username" error="Username is taken"></ml-input>
 * ```
 *
 * @slot prefix - Content before the input (icon, text)
 * @slot suffix - Content after the input (icon, button)
 *
 * @fires ml-input - Emitted on input
 * @fires ml-change - Emitted on change (blur)
 * @fires ml-focus - Emitted on focus
 * @fires ml-blur - Emitted on blur
 */
@MelodicComponent({
	selector: 'ml-input',
	template: (c: Input) => html`
		<div
			class=${classMap({
				'ml-input': true,
				[`ml-input--${c.size}`]: true,
				'ml-input--disabled': c.disabled,
				'ml-input--readonly': c.readonly,
				'ml-input--error': !!c.error,
				'ml-input--focused': c._focused
			})}
		>
			${when(
				c.label,
				() => html`
					<label class="ml-input__label" for="input">
						${c.label}
						${when(c.required, () => html`<span class="ml-input__required">*</span>`)}
					</label>
				`
			)}

			<div class="ml-input__wrapper">
				<slot name="prefix"></slot>
				<input
					id="input"
					class="ml-input__field"
					type="${c.type}"
					.value=${c.value}
					placeholder="${c.placeholder}"
					?disabled=${c.disabled}
					?readonly=${c.readonly}
					?required=${c.required}
					autocomplete="${c.autocomplete}"
					aria-invalid=${c.error ? 'true' : 'false'}
					aria-describedby=${c.error ? 'error' : c.hint ? 'hint' : ''}
					@input=${c.handleInput}
					@change=${c.handleChange}
					@focus=${c.handleFocus}
					@blur=${c.handleBlur}
				/>
				<slot name="suffix"></slot>
			</div>

			${when(
				c.error,
				() => html`<span id="error" class="ml-input__error">${c.error}</span>`,
				() => html`${when(c.hint, () => html`<span id="hint" class="ml-input__hint">${c.hint}</span>`)}`
			)}
		</div>
	`,
	styles: () => css`
		:host {
			display: block;
			width: 100%;
		}

		.ml-input {
			display: flex;
			flex-direction: column;
			gap: var(--ml-space-1);
		}

		/* Label */
		.ml-input__label {
			font-size: var(--ml-text-sm);
			font-weight: var(--ml-font-medium);
			color: var(--ml-color-text);
		}

		.ml-input__required {
			color: var(--ml-color-danger);
			margin-left: var(--ml-space-0.5);
		}

		/* Wrapper */
		.ml-input__wrapper {
			display: flex;
			align-items: center;
			gap: var(--ml-space-2);
			background-color: var(--ml-color-surface);
			border: var(--ml-border) solid var(--ml-color-border);
			border-radius: var(--ml-radius-md);
			transition:
				border-color var(--ml-duration-150) var(--ml-ease-in-out),
				box-shadow var(--ml-duration-150) var(--ml-ease-in-out);
		}

		.ml-input--focused .ml-input__wrapper {
			border-color: var(--ml-color-focus-ring);
			box-shadow: 0 0 0 3px var(--ml-color-primary-subtle);
		}

		.ml-input--error .ml-input__wrapper {
			border-color: var(--ml-color-danger);
		}

		.ml-input--error.ml-input--focused .ml-input__wrapper {
			box-shadow: 0 0 0 3px var(--ml-color-danger-subtle);
		}

		.ml-input--disabled .ml-input__wrapper {
			background-color: var(--ml-color-surface-sunken);
			opacity: 0.5;
		}

		/* Field */
		.ml-input__field {
			flex: 1;
			min-width: 0;
			border: none;
			background: transparent;
			color: var(--ml-color-text);
			font-family: var(--ml-font-sans);
			font-size: inherit;
			line-height: var(--ml-leading-normal);
		}

		.ml-input__field:focus {
			outline: none;
		}

		.ml-input__field::placeholder {
			color: var(--ml-color-text-muted);
		}

		.ml-input__field:disabled {
			cursor: not-allowed;
		}

		/* Sizes */
		.ml-input--sm .ml-input__wrapper {
			padding: var(--ml-space-1.5) var(--ml-space-2.5);
		}

		.ml-input--sm .ml-input__field {
			font-size: var(--ml-text-sm);
		}

		.ml-input--md .ml-input__wrapper {
			padding: var(--ml-space-2) var(--ml-space-3);
		}

		.ml-input--md .ml-input__field {
			font-size: var(--ml-text-sm);
		}

		.ml-input--lg .ml-input__wrapper {
			padding: var(--ml-space-2.5) var(--ml-space-4);
		}

		.ml-input--lg .ml-input__field {
			font-size: var(--ml-text-base);
		}

		/* Hint & Error */
		.ml-input__hint,
		.ml-input__error {
			font-size: var(--ml-text-sm);
		}

		.ml-input__hint {
			color: var(--ml-color-text-muted);
		}

		.ml-input__error {
			color: var(--ml-color-danger);
		}

		/* Slots */
		::slotted([slot='prefix']),
		::slotted([slot='suffix']) {
			display: flex;
			align-items: center;
			color: var(--ml-color-text-muted);
		}
	`,
	attributes: ['type', 'value', 'placeholder', 'label', 'hint', 'error', 'size', 'disabled', 'readonly', 'required', 'autocomplete']
})
export class Input implements IElementRef, OnInit {
	elementRef!: HTMLElement;

	/** Input type */
	type: InputType = 'text';

	/** Current value */
	value = '';

	/** Placeholder text */
	placeholder = '';

	/** Label text */
	label = '';

	/** Hint text shown below input */
	hint = '';

	/** Error message (shows error state when set) */
	error = '';

	/** Input size */
	size: Size = 'md';

	/** Disable the input */
	disabled = false;

	/** Make input readonly */
	readonly = false;

	/** Mark as required */
	required = false;

	/** Autocomplete attribute */
	autocomplete = 'off';

	/** Internal focus state */
	_focused = false;

	onInit(): void {
		// Set up aria-label if no label provided
		if (!this.label && this.placeholder) {
			this.elementRef.setAttribute('aria-label', this.placeholder);
		}
	}

	handleInput = (event: Event): void => {
		const target = event.target as HTMLInputElement;
		this.value = target.value;

		this.elementRef.dispatchEvent(
			new CustomEvent('ml-input', {
				bubbles: true,
				composed: true,
				detail: { value: this.value }
			})
		);
	};

	handleChange = (event: Event): void => {
		const target = event.target as HTMLInputElement;
		this.value = target.value;

		this.elementRef.dispatchEvent(
			new CustomEvent('ml-change', {
				bubbles: true,
				composed: true,
				detail: { value: this.value }
			})
		);
	};

	handleFocus = (): void => {
		this._focused = true;
		this.elementRef.dispatchEvent(
			new CustomEvent('ml-focus', {
				bubbles: true,
				composed: true
			})
		);
	};

	handleBlur = (): void => {
		this._focused = false;
		this.elementRef.dispatchEvent(
			new CustomEvent('ml-blur', {
				bubbles: true,
				composed: true
			})
		);
	};
}
