import { html, classMap, when, repeat } from '@melodicdev/core';
import type { AutocompleteComponent } from './autocomplete.component.js';
import type { AutocompleteOption } from './autocomplete.types.js';

export function autocompleteTemplate(c: AutocompleteComponent) {
	return html`
		<div
			class=${classMap({
				'ml-autocomplete': true,
				[`ml-autocomplete--${c.size}`]: true,
				'ml-autocomplete--open': c.isOpen,
				'ml-autocomplete--disabled': c.disabled,
				'ml-autocomplete--error': !!c.error,
				'ml-autocomplete--has-value': c.hasValue,
				'ml-autocomplete--multiple': c.multiple
			})}
		>
			${when(
				!!c.label,
				() => html`
					<label class="ml-autocomplete__label">
						${c.label}
						${when(c.required, () => html`<span class="ml-autocomplete__required">*</span>`)}
					</label>
				`
			)}

			<div class="ml-autocomplete__control">
				<div
					class="ml-autocomplete__trigger"
					@click=${c.handleInputClick}
				>
					${when(
						c.multiple,
						() => renderMultiValue(c),
						() => renderSingleValue(c)
					)}
				</div>

				<div
					class="ml-autocomplete__dropdown"
					role="listbox"
					popover="manual"
				>
					${c.loading
						? html`<div class="ml-autocomplete__loading">
							<ml-spinner size="sm"></ml-spinner>
							<span>Searching...</span>
						</div>`
						: c.filteredOptions.length
							? repeat(
									c.filteredOptions,
									(option) => `${option.value}-${c.multiple ? c.values.includes(option.value) : c.value === option.value}`,
									(option, index) => renderOption(c, option, index)
								)
							: html`<div class="ml-autocomplete__empty">No results found</div>`}
				</div>
			</div>

			${when(
				!!c.error,
				() => html`<span class="ml-autocomplete__error">${c.error}</span>`,
				() => html`${when(!!c.hint, () => html`<span class="ml-autocomplete__hint">${c.hint}</span>`)}`
			)}
		</div>
	`;
}

function renderSingleValue(c: AutocompleteComponent) {
	const showClear = !c.multiple && c.hasValue && !c.disabled;

	return html`
		${when(c.showIcon, () => html`<ml-icon icon="magnifying-glass" size="sm" format="regular" class="ml-autocomplete__search-icon"></ml-icon>`)}
		<input
			class="ml-autocomplete__input"
			type="text"
			placeholder=${c.hasValue ? c.displayText : c.placeholder}
			aria-label=${c.label || c.placeholder || 'Search'}
			.value=${c.hasValue && !c.search ? c.displayText : c.search}
			@input=${c.handleInput}
			@focus=${c.handleFocus}
			@click=${c.handleInputClick}
			?disabled=${c.disabled}
			autocomplete="off"
		/>
		${when(
			showClear,
			() => html`
				<button type="button" class="ml-autocomplete__clear" aria-label="Clear selection" @click=${c.handleClear}>
					<ml-icon icon="x" size="sm" format="bold"></ml-icon>
				</button>
			`
		)}
	`;
}

function renderMultiValue(c: AutocompleteComponent) {
	return html`
		${when(c.showIcon, () => html`<ml-icon icon="magnifying-glass" size="sm" format="regular" class="ml-autocomplete__search-icon"></ml-icon>`)}
		<span class="ml-autocomplete__tags">
			${repeat(
				c.selectedOptions,
				(option) => option.value,
				(option) => html`
					<span class="ml-autocomplete__tag">
						${option.avatarUrl
							? html`<img class="ml-autocomplete__tag-avatar" src="${option.avatarUrl}" alt="${option.avatarAlt || option.label}" />`
							: html``}
						<span class="ml-autocomplete__tag-label">${option.label}</span>
						<button type="button" class="ml-autocomplete__tag-remove" aria-label="Remove ${option.label}" @click=${(event: Event) => c.handleTagRemove(event, option.value)}>
							<ml-icon icon="x" size="sm" format="bold"></ml-icon>
						</button>
					</span>
				`
			)}
		</span>
		<input
			class="ml-autocomplete__input"
			type="text"
			placeholder=${c.values.length ? '' : c.placeholder}
			aria-label=${c.label || c.placeholder || 'Search'}
			.value=${c.search}
			@input=${c.handleInput}
			@focus=${c.handleFocus}
			@click=${c.handleInputClick}
			?disabled=${c.disabled}
			autocomplete="off"
		/>
	`;
}

function renderOption(c: AutocompleteComponent, option: AutocompleteOption, index: number) {
	const isSelected = c.multiple ? c.values.includes(option.value) : c.value === option.value;
	const isFocused = c.focusedIndex === index;

	return html`
		<div
			class=${classMap({
				'ml-autocomplete__option': true,
				'ml-autocomplete__option--selected': isSelected,
				'ml-autocomplete__option--focused': isFocused,
				'ml-autocomplete__option--disabled': !!option.disabled
			})}
			role="option"
			aria-selected=${isSelected}
			aria-disabled=${option.disabled || false}
			@click=${(e: Event) => c.handleOptionClick(e, option)}
		>
			${when(!!option.avatarUrl, () => html`<img class="ml-autocomplete__option-avatar" src="${option.avatarUrl}" alt="${option.avatarAlt || option.label}" />`)}
			${when(!option.avatarUrl && !!option.icon, () => html`<ml-icon icon="${option.icon}" size="sm" class="ml-autocomplete__option-icon"></ml-icon>`)}
			<span class="ml-autocomplete__option-content">
				<span class="ml-autocomplete__option-label">${option.label}</span>
				${when(!!option.subtitle, () => html`<span class="ml-autocomplete__option-subtitle">${option.subtitle}</span>`)}
			</span>
			${when(isSelected, () => html`<ml-icon icon="check" size="sm" format="regular" class="ml-autocomplete__option-check"></ml-icon>`)}
		</div>
	`;
}
