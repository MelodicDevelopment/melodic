import { MelodicComponent, html, css, classMap, when } from '@melodicdev/core';
import type { IElementRef, OnInit } from '@melodicdev/core';
import type { Size } from '../../../types/index.js';

/**
 * ml-textarea - Multi-line text input component
 *
 * @example
 * ```html
 * <ml-textarea label="Description" placeholder="Enter description"></ml-textarea>
 * <ml-textarea label="Bio" rows="5" max-length="500"></ml-textarea>
 * <ml-textarea label="Notes" auto-resize></ml-textarea>
 * ```
 *
 * @fires ml-input - Emitted on input
 * @fires ml-change - Emitted on change (blur)
 * @fires ml-focus - Emitted on focus
 * @fires ml-blur - Emitted on blur
 */
@MelodicComponent({
	selector: 'ml-textarea',
	template: (c: Textarea) => html`
		<div
			class=${classMap({
				'ml-textarea': true,
				[`ml-textarea--${c.size}`]: true,
				'ml-textarea--disabled': c.disabled,
				'ml-textarea--readonly': c.readonly,
				'ml-textarea--error': !!c.error,
				'ml-textarea--focused': c._focused,
				'ml-textarea--resize': c.resize
			})}
		>
			${when(
				c.label,
				() => html`
					<label class="ml-textarea__label" for="textarea">
						${c.label}
						${when(c.required, () => html`<span class="ml-textarea__required">*</span>`)}
					</label>
				`
			)}

			<textarea
				id="textarea"
				class="ml-textarea__field"
				.value=${c.value}
				placeholder="${c.placeholder}"
				rows="${c.rows}"
				?disabled=${c.disabled}
				?readonly=${c.readonly}
				?required=${c.required}
				maxlength="${c.maxLength || ''}"
				aria-invalid=${c.error ? 'true' : 'false'}
				aria-describedby=${c.error ? 'error' : c.hint ? 'hint' : ''}
				@input=${c.handleInput}
				@change=${c.handleChange}
				@focus=${c.handleFocus}
				@blur=${c.handleBlur}
			></textarea>

			<div class="ml-textarea__footer">
				${when(
					c.error,
					() => html`<span id="error" class="ml-textarea__error">${c.error}</span>`,
					() => html`${when(c.hint, () => html`<span id="hint" class="ml-textarea__hint">${c.hint}</span>`)}`
				)}
				${when(
					c.maxLength,
					() => html`
						<span class="ml-textarea__counter"> ${c.value.length} / ${c.maxLength} </span>
					`
				)}
			</div>
		</div>
	`,
	styles: () => css`
		:host {
			display: block;
			width: 100%;
		}

		.ml-textarea {
			display: flex;
			flex-direction: column;
			gap: var(--ml-space-1);
		}

		/* Label */
		.ml-textarea__label {
			font-size: var(--ml-text-sm);
			font-weight: var(--ml-font-medium);
			color: var(--ml-color-text);
		}

		.ml-textarea__required {
			color: var(--ml-color-danger);
			margin-left: var(--ml-space-0.5);
		}

		/* Field */
		.ml-textarea__field {
			width: 100%;
			min-height: 80px;
			padding: var(--ml-space-2) var(--ml-space-3);
			background-color: var(--ml-color-surface);
			border: var(--ml-border) solid var(--ml-color-border);
			border-radius: var(--ml-radius-md);
			color: var(--ml-color-text);
			font-family: var(--ml-font-sans);
			font-size: var(--ml-text-sm);
			line-height: var(--ml-leading-normal);
			resize: none;
			transition:
				border-color var(--ml-duration-150) var(--ml-ease-in-out),
				box-shadow var(--ml-duration-150) var(--ml-ease-in-out);
		}

		.ml-textarea--resize .ml-textarea__field {
			resize: vertical;
		}

		.ml-textarea__field:focus {
			outline: none;
			border-color: var(--ml-color-focus-ring);
			box-shadow: 0 0 0 3px var(--ml-color-primary-subtle);
		}

		.ml-textarea__field::placeholder {
			color: var(--ml-color-text-muted);
		}

		.ml-textarea__field:disabled {
			background-color: var(--ml-color-surface-sunken);
			opacity: 0.5;
			cursor: not-allowed;
		}

		/* Error state */
		.ml-textarea--error .ml-textarea__field {
			border-color: var(--ml-color-danger);
		}

		.ml-textarea--error .ml-textarea__field:focus {
			box-shadow: 0 0 0 3px var(--ml-color-danger-subtle);
		}

		/* Sizes */
		.ml-textarea--sm .ml-textarea__field {
			padding: var(--ml-space-1.5) var(--ml-space-2.5);
			font-size: var(--ml-text-sm);
		}

		.ml-textarea--lg .ml-textarea__field {
			padding: var(--ml-space-3) var(--ml-space-4);
			font-size: var(--ml-text-base);
		}

		/* Footer */
		.ml-textarea__footer {
			display: flex;
			justify-content: space-between;
			align-items: center;
			min-height: 1.25rem;
		}

		.ml-textarea__hint,
		.ml-textarea__error {
			font-size: var(--ml-text-sm);
		}

		.ml-textarea__hint {
			color: var(--ml-color-text-muted);
		}

		.ml-textarea__error {
			color: var(--ml-color-danger);
		}

		.ml-textarea__counter {
			font-size: var(--ml-text-xs);
			color: var(--ml-color-text-muted);
			margin-left: auto;
		}
	`,
	attributes: ['value', 'placeholder', 'label', 'hint', 'error', 'size', 'rows', 'max-length', 'disabled', 'readonly', 'required', 'resize']
})
export class Textarea implements IElementRef, OnInit {
	elementRef!: HTMLElement;

	/** Current value */
	value = '';

	/** Placeholder text */
	placeholder = '';

	/** Label text */
	label = '';

	/** Hint text shown below textarea */
	hint = '';

	/** Error message (shows error state when set) */
	error = '';

	/** Input size */
	size: Size = 'md';

	/** Number of visible text lines */
	rows = 3;

	/** Maximum character length */
	maxLength = 0;

	/** Disable the textarea */
	disabled = false;

	/** Make textarea readonly */
	readonly = false;

	/** Mark as required */
	required = false;

	/** Allow vertical resize */
	resize = false;

	/** Internal focus state */
	_focused = false;

	onInit(): void {
		if (!this.label && this.placeholder) {
			this.elementRef.setAttribute('aria-label', this.placeholder);
		}
	}

	handleInput = (event: Event): void => {
		const target = event.target as HTMLTextAreaElement;
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
		const target = event.target as HTMLTextAreaElement;
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
