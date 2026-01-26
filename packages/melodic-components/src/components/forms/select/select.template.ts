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
				'ml-select--has-value': c.hasValue,
				'ml-select--multiple': c.multiple
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

			<div class="ml-select__control">
				<div
					class="ml-select__trigger"
					role="combobox"
					tabindex=${c.disabled ? '-1' : '0'}
					aria-haspopup="listbox"
					aria-expanded=${c.isOpen}
					aria-labelledby=${c.label ? 'label' : ''}
					@click=${c.toggle}
				>
					<span class="ml-select__value">
						${when(
							c.multiple,
							() => renderMultiValue(c),
							() => renderSingleValue(c)
						)}
					</span>
					<ml-icon icon="caret-down" size="sm" format="regular" class="ml-select__chevron"></ml-icon>
				</div>

				<div
					class=${classMap({
						'ml-select__dropdown': true,
						'ml-select__dropdown--open': c.isOpen
					})}
					role="listbox"
					aria-multiselectable=${c.multiple || false}
				>
					${c.filteredOptions.length
						? repeat(
								c.filteredOptions,
								(option) => `${option.value}-${c.multiple ? c.values.includes(option.value) : c.value === option.value}`,
								(option, index) => renderOption(c, option, index)
							)
						: html`<div class="ml-select__empty">No results found</div>`}
				</div>
			</div>

			${when(
				!!c.error,
				() => html`<span class="ml-select__error">${c.error}</span>`,
				() => html`${when(!!c.hint, () => html`<span class="ml-select__hint">${c.hint}</span>`)}`
			)}
		</div>
	`;
}

function renderSingleValue(c: SelectComponent) {
	return html`
		${when(
			!!c.selectedOption?.icon,
			() => html`<ml-icon icon="${c.selectedOption?.icon ?? ''}" size="sm" class="ml-select__value-icon"></ml-icon>`
		)}
		${c.displayText
			? html`<span class="ml-select__value-text">${c.displayText}</span>`
			: html`<span class="ml-select__placeholder">${c.placeholder}</span>`}
	`;
}

function renderMultiValue(c: SelectComponent) {
	return html`
		<ml-icon icon="magnifying-glass" size="sm" format="regular" class="ml-select__search-icon"></ml-icon>
		<span class="ml-select__tags">
			${repeat(
				c.selectedOptions,
				(option) => option.value,
				(option) => html`
					<span class="ml-select__tag">
						${option.avatarUrl
							? html`<img class="ml-select__tag-avatar" src="${option.avatarUrl}" alt="${option.avatarAlt || option.label}" />`
							: html``}
						<span class="ml-select__tag-label">${option.label}</span>
						<button type="button" class="ml-select__tag-remove" aria-label="Remove ${option.label}" @click=${(event: Event) => c.handleTagRemove(event, option.value)}>
							<ml-icon icon="x" size="sm" format="bold"></ml-icon>
						</button>
					</span>
				`
			)}
		</span>
		<input
			class="ml-select__search"
			type="text"
			placeholder=${c.values.length ? '' : c.placeholder}
			aria-label=${c.placeholder || 'Search'}
			.value=${c.search}
			@input=${c.handleSearchInput}
			@click=${c.handleSearchClick}
		/>
	`;
}

function renderOption(c: SelectComponent, option: SelectOption, index: number) {
	const isSelected = c.multiple ? c.values.includes(option.value) : c.value === option.value;
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
			${when(!!option.avatarUrl, () => html`<img class="ml-select__option-avatar" src="${option.avatarUrl}" alt="${option.avatarAlt || option.label}" />`)}
			${when(!option.avatarUrl && !!option.icon, () => html`<ml-icon icon="${option.icon}" size="sm" class="ml-select__option-icon"></ml-icon>`)}
			<span class="ml-select__option-label">${option.label}</span>
			${when(isSelected, () => html`<ml-icon icon="check" size="sm" format="regular" class="ml-select__option-check"></ml-icon>`)}
		</div>
	`;
}
