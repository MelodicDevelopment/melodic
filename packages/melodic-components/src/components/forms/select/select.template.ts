import { html, classMap, when, repeat } from '@melodicdev/core';
import type { SelectComponent } from './select.component.js';
import type { SelectOption } from './select.types.js';

export function selectTemplate(c: SelectComponent) {
	return html`
		<div
			class=${classMap({
				'ml-select': true,
				[`ml-select--${c.size}`]: true,
				'ml-select--open': c.isOpen,
				'ml-select--disabled': c.disabled,
				'ml-select--error': !!c.error,
				'ml-select--has-value': !!c.value
			})}
		>
			${when(
				!!c.label,
				() => html`
					<label class="ml-select__label">
						${c.label}
						${when(c.required, () => html`<span class="ml-select__required">*</span>`)}
					</label>
				`
			)}

			<button
				type="button"
				class="ml-select__trigger"
				?disabled=${c.disabled}
				aria-haspopup="listbox"
				aria-expanded=${c.isOpen}
				aria-labelledby=${c.label ? 'label' : ''}
				@click=${c.toggle}
			>
				<span class="ml-select__value">
					${when(
						!!c.selectedOption?.icon,
						() =>
							html`<ml-icon icon="${c.selectedOption?.icon ?? ''}" size="sm" class="ml-select__value-icon"></ml-icon>`
					)}
					${c.displayText || html`<span class="ml-select__placeholder">${c.placeholder}</span>`}
				</span>
				<ml-icon icon="caret-down" size="sm" class="ml-select__chevron"></ml-icon>
			</button>

			${when(
				c.isOpen,
				() => html`
					<div class="ml-select__dropdown" role="listbox">
						${repeat(
							c.options,
							(option) => option.value,
							(option, index) => renderOption(c, option, index)
						)}
					</div>
				`
			)}

			${when(
				!!c.error,
				() => html`<span class="ml-select__error">${c.error}</span>`,
				() => html`${when(!!c.hint, () => html`<span class="ml-select__hint">${c.hint}</span>`)}`
			)}
		</div>
	`;
}

function renderOption(c: SelectComponent, option: SelectOption, index: number) {
	const isSelected = c.value === option.value;
	const isFocused = c.focusedIndex === index;

	return html`
		<div
			class=${classMap({
				'ml-select__option': true,
				'ml-select__option--selected': isSelected,
				'ml-select__option--focused': isFocused,
				'ml-select__option--disabled': !!option.disabled
			})}
			role="option"
			aria-selected=${isSelected}
			aria-disabled=${option.disabled || false}
			@click=${(e: Event) => c.handleOptionClick(e, option)}
		>
			${when(!!option.icon, () => html`<ml-icon icon="${option.icon}" size="sm" class="ml-select__option-icon"></ml-icon>`)}
			<span class="ml-select__option-label">${option.label}</span>
			${when(isSelected, () => html`<ml-icon icon="check" size="sm" class="ml-select__option-check"></ml-icon>`)}
		</div>
	`;
}
