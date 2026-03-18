import { MelodicComponent } from '@melodicdev/core';
import type { IElementRef, OnCreate, OnDestroy } from '@melodicdev/core';
import type { Size } from '../../../types/index.js';
import type { AutocompleteOption, AutocompleteSearchFn } from './autocomplete.types.js';
import { computePosition, offset, flip, shift } from '../../../utils/positioning/index.js';
import { autocompleteTemplate } from './autocomplete.template.js';
import { autocompleteStyles } from './autocomplete.styles.js';

/**
 * ml-autocomplete - Typeahead/autocomplete form component
 *
 * Provides a text input with dropdown suggestions. Supports static option lists
 * or async search via a promise-returning function.
 *
 * @example
 * ```html
 * <ml-autocomplete
 *   label="Search users"
 *   placeholder="Type to search..."
 *   .options=${userOptions}
 * ></ml-autocomplete>
 *
 * <ml-autocomplete
 *   label="Search"
 *   .searchFn=${async (query) => fetch(`/api/search?q=${query}`).then(r => r.json())}
 *   .debounce=${300}
 * ></ml-autocomplete>
 * ```
 *
 * @fires ml:change - Emitted when selection changes
 * @fires ml:search - Emitted when search query changes
 * @fires ml:open - Emitted when dropdown opens
 * @fires ml:close - Emitted when dropdown closes
 */
@MelodicComponent({
	selector: 'ml-autocomplete',
	template: autocompleteTemplate,
	styles: autocompleteStyles,
	attributes: ['label', 'placeholder', 'hint', 'error', 'size', 'disabled', 'required', 'value', 'multiple']
})
export class AutocompleteComponent implements IElementRef, OnCreate, OnDestroy {
	elementRef!: HTMLElement;

	/** Label text */
	label = '';

	/** Placeholder text */
	placeholder = 'Search';

	/** Hint text shown below input */
	hint = '';

	/** Error message (shows error state when set) */
	error = '';

	/** Component size */
	size: Size = 'md';

	/** Disable the component */
	disabled = false;

	/** Mark as required */
	required = false;

	/** Enable multi-select mode */
	multiple = false;

	/** Currently selected value (single mode) */
	value = '';

	/** Currently selected values (multi mode) */
	values: string[] = [];

	/** Static options list */
	options: AutocompleteOption[] = [];

	/** Async search function */
	searchFn: AutocompleteSearchFn | null = null;

	/** Debounce ms for async search */
	debounce = 300;

	/** Min chars before searching (0 = show on focus) */
	minChars = 0;

	/** Show search icon */
	showIcon = true;

	/** Current search query */
	search = '';

	/** Whether dropdown is open */
	isOpen = false;

	/** Currently focused option index */
	focusedIndex = -1;

	/** Loading state for async search */
	_loading = false;

	/** Resolved async results */
	_asyncOptions: AutocompleteOption[] = [];

	private readonly _handleKeyDown = this.onKeyDown.bind(this);
	private readonly _handleDocumentClick = this.onDocumentClick.bind(this);
	private _handleScroll: ((event: Event) => void) | null = null;
	private _debounceTimer: ReturnType<typeof setTimeout> | null = null;
	private _syncingValues = false;

	onCreate(): void {
		this.elementRef.addEventListener('keydown', this._handleKeyDown);
	}

	onDestroy(): void {
		this.elementRef.removeEventListener('keydown', this._handleKeyDown);
		this.removeScrollListener();
		this.removeDocumentClickListener();
		if (this._debounceTimer) {
			clearTimeout(this._debounceTimer);
		}
	}

	onPropertyChange(name: string): void {
		if (this._syncingValues) return;

		if (name === 'multiple') {
			if (this.multiple) {
				if (!this.values.length && this.value) {
					this.updateValues([this.value]);
				}
				return;
			}
			if (this.values.length) {
				this.value = this.values[0] ?? '';
			}
			this.updateValues([]);
			this.search = '';
			return;
		}

		if (name === 'values') {
			const rawValues = this.values as unknown;
			let normalized: string[] = [];
			if (typeof rawValues === 'string') {
				normalized = rawValues
					.split(',')
					.map((v) => v.trim())
					.filter((v) => v.length > 0);
			} else if (Array.isArray(rawValues)) {
				normalized = rawValues.filter((v) => typeof v === 'string');
			}
			normalized = Array.from(new Set(normalized));
			if (!this.areValuesEqual(this.values, normalized)) {
				this.updateValues(normalized);
			}
			if (!this.multiple) {
				this.value = normalized[0] ?? '';
				this.updateValues([]);
			}
			return;
		}

		if (name === 'value' && this.multiple) {
			if (this.value) {
				const nextValues = Array.from(new Set([...this.values, this.value]));
				if (!this.areValuesEqual(this.values, nextValues)) {
					this.updateValues(nextValues);
				}
			}
		}
	}

	/** Get the selected option (single mode) */
	get selectedOption(): AutocompleteOption | undefined {
		return this.allOptions.find((opt) => opt.value === this.value);
	}

	/** Get selected options (multi mode) */
	get selectedOptions(): AutocompleteOption[] {
		if (!this.multiple) {
			return this.selectedOption ? [this.selectedOption] : [];
		}
		return this.allOptions.filter((opt) => this.values.includes(opt.value));
	}

	/** All available options (static or async) */
	get allOptions(): AutocompleteOption[] {
		return this.searchFn ? this._asyncOptions : this.options;
	}

	/** Filtered options for display */
	get filteredOptions(): AutocompleteOption[] {
		if (this.searchFn) {
			return this._asyncOptions;
		}

		const query = this.search.trim().toLowerCase();
		if (!query) return this.options;

		return this.options.filter((option) => {
			const labelMatch = option.label.toLowerCase().includes(query);
			const valueMatch = option.value.toLowerCase().includes(query);
			const subtitleMatch = option.subtitle?.toLowerCase().includes(query) ?? false;
			return labelMatch || valueMatch || subtitleMatch;
		});
	}

	get hasValue(): boolean {
		return this.multiple ? this.values.length > 0 : !!this.value;
	}

	/** Display text for the input in single mode */
	get displayText(): string {
		if (this.multiple) return '';
		return this.selectedOption?.label || '';
	}

	/** Open the dropdown */
	open = (): void => {
		if (this.disabled || this.isOpen) return;
		if (this.minChars > 0 && this.search.length < this.minChars) return;

		const dropdownEl = this.getDropdownEl();
		if (!dropdownEl) return;

		dropdownEl.showPopover();
		this.isOpen = true;
		this.focusedIndex = this.findFirstEnabledIndex();
		this.positionDropdown();
		this.addScrollListener();
		this.addDocumentClickListener();

		this.elementRef.dispatchEvent(
			new CustomEvent('ml:open', { bubbles: true, composed: true })
		);
	};

	/** Close the dropdown */
	close = (): void => {
		if (!this.isOpen) return;

		this.getDropdownEl()?.hidePopover();
		this.isOpen = false;
		this.focusedIndex = -1;
		this.removeScrollListener();
		this.removeDocumentClickListener();

		this.elementRef.dispatchEvent(
			new CustomEvent('ml:close', { bubbles: true, composed: true })
		);
	};

	/** Select an option */
	selectOption = (option: AutocompleteOption): void => {
		if (option.disabled) return;

		if (this.multiple) {
			this.toggleOption(option);
			return;
		}

		this.value = option.value;
		this.search = '';
		this.close();

		this.elementRef.dispatchEvent(
			new CustomEvent('ml:change', {
				bubbles: true,
				composed: true,
				detail: { value: this.value, option }
			})
		);
	};

	/** Handle click on option */
	handleOptionClick = (event: Event, option: AutocompleteOption): void => {
		event.stopPropagation();
		this.selectOption(option);
	};

	/** Handle input changes */
	handleInput = (event: Event): void => {
		if (this.disabled) return;
		const target = event.target as HTMLInputElement;
		this.search = target.value;

		// In single mode, clear the current value when the user types
		if (!this.multiple && this.value) {
			this.value = '';
			this.elementRef.dispatchEvent(
				new CustomEvent('ml:change', {
					bubbles: true,
					composed: true,
					detail: { value: '', option: null }
				})
			);
		}

		this.elementRef.dispatchEvent(
			new CustomEvent('ml:search', {
				bubbles: true,
				composed: true,
				detail: { query: this.search }
			})
		);

		if (this.minChars > 0 && this.search.length < this.minChars) {
			this.close();
			return;
		}

		this.focusedIndex = this.findFirstEnabledIndex();

		if (!this.isOpen) {
			this.open();
		}

		if (this.searchFn) {
			this.debouncedSearch(this.search);
		}
	};

	/** Handle input focus */
	handleFocus = (): void => {
		if (this.disabled) return;

		if (this.minChars === 0) {
			if (this.searchFn && this._asyncOptions.length === 0) {
				this.debouncedSearch('');
			}
			if (!this.isOpen) {
				this.open();
			}
		}
	};

	/** Handle input click */
	handleInputClick = (event: Event): void => {
		event.stopPropagation();
		if (!this.isOpen && this.minChars === 0) {
			if (this.searchFn && this._asyncOptions.length === 0) {
				this.debouncedSearch('');
			}
			this.open();
		}
	};

	/** Handle tag remove in multi mode */
	handleTagRemove = (event: Event, value: string): void => {
		event.stopPropagation();
		if (this.disabled) return;

		this.values = this.values.filter((item) => item !== value);
		this.elementRef.dispatchEvent(
			new CustomEvent('ml:change', {
				bubbles: true,
				composed: true,
				detail: { values: [...this.values], options: this.selectedOptions }
			})
		);
	};

	/** Clear the current value (single mode) */
	handleClear = (event: Event): void => {
		event.stopPropagation();
		if (this.disabled) return;

		this.value = '';
		this.search = '';
		this.elementRef.dispatchEvent(
			new CustomEvent('ml:change', {
				bubbles: true,
				composed: true,
				detail: { value: '', option: null }
			})
		);

		// Focus the input after clearing
		const input = this.elementRef.shadowRoot?.querySelector('.ml-autocomplete__input') as HTMLInputElement | null;
		input?.focus();
	};

	private toggleOption(option: AutocompleteOption): void {
		const exists = this.values.includes(option.value);
		this.values = exists ? this.values.filter((v) => v !== option.value) : [...this.values, option.value];

		this.elementRef.dispatchEvent(
			new CustomEvent('ml:change', {
				bubbles: true,
				composed: true,
				detail: { values: [...this.values], options: this.selectedOptions, option }
			})
		);

		// Clear search and refocus input
		this.search = '';
		const input = this.elementRef.shadowRoot?.querySelector('.ml-autocomplete__input') as HTMLInputElement | null;
		input?.focus();
	}

	private debouncedSearch(query: string): void {
		if (this._debounceTimer) {
			clearTimeout(this._debounceTimer);
		}
		this._debounceTimer = setTimeout(() => {
			this.executeSearch(query);
		}, this.debounce);
	}

	private async executeSearch(query: string): Promise<void> {
		if (!this.searchFn) return;

		this._loading = true;
		try {
			this._asyncOptions = await this.searchFn(query);
			this.focusedIndex = this.findFirstEnabledIndex();
		} finally {
			this._loading = false;
		}
	}

	/** Close dropdown on clicks outside the component */
	private onDocumentClick(event: MouseEvent): void {
		const path = event.composedPath();
		if (!path.includes(this.elementRef)) {
			this.close();
		}
	}

	private addDocumentClickListener(): void {
		document.addEventListener('click', this._handleDocumentClick, true);
	}

	private removeDocumentClickListener(): void {
		document.removeEventListener('click', this._handleDocumentClick, true);
	}

	private positionDropdown(): void {
		const triggerEl = this.elementRef.shadowRoot?.querySelector('.ml-autocomplete__trigger') as HTMLElement | null;
		const dropdownEl = this.getDropdownEl();
		if (!triggerEl || !dropdownEl) return;

		dropdownEl.style.width = `${triggerEl.offsetWidth}px`;

		const { x, y } = computePosition(triggerEl, dropdownEl, {
			placement: 'bottom-start',
			middleware: [offset(4), flip(), shift({ padding: 8 })]
		});

		dropdownEl.style.left = `${x}px`;
		dropdownEl.style.top = `${y}px`;
	}

	private addScrollListener(): void {
		this._handleScroll = (event: Event) => {
			const dropdownEl = this.getDropdownEl();
			if (dropdownEl?.contains(event.target as Node)) return;
			this.close();
		};
		window.addEventListener('scroll', this._handleScroll, true);
	}

	private removeScrollListener(): void {
		if (this._handleScroll) {
			window.removeEventListener('scroll', this._handleScroll, true);
			this._handleScroll = null;
		}
	}

	private getDropdownEl(): HTMLElement | null {
		return this.elementRef.shadowRoot?.querySelector('.ml-autocomplete__dropdown') as HTMLElement | null;
	}

	private onKeyDown(event: KeyboardEvent): void {
		if (this.disabled) return;

		switch (event.key) {
			case 'Enter':
				if (this.isOpen && this.focusedIndex >= 0) {
					event.preventDefault();
					const option = this.filteredOptions[this.focusedIndex];
					if (option && !option.disabled) {
						this.selectOption(option);
					}
				}
				break;

			case 'Escape':
				event.preventDefault();
				this.close();
				break;

			case 'ArrowDown':
				event.preventDefault();
				if (!this.isOpen) {
					this.open();
				} else {
					this.focusNextOption();
				}
				break;

			case 'ArrowUp':
				event.preventDefault();
				if (this.isOpen) {
					this.focusPreviousOption();
				}
				break;

			case 'Backspace':
				if (this.multiple && this.search === '' && this.values.length > 0) {
					const lastValue = this.values[this.values.length - 1];
					this.values = this.values.slice(0, -1);
					this.elementRef.dispatchEvent(
						new CustomEvent('ml:change', {
							bubbles: true,
							composed: true,
							detail: { values: [...this.values], options: this.selectedOptions, removedValue: lastValue }
						})
					);
				}
				break;

			case 'Tab':
				this.close();
				break;

			default:
				break;
		}
	}

	private focusNextOption(): void {
		const options = this.filteredOptions;
		let index = this.focusedIndex + 1;
		while (index < options.length) {
			if (!options[index].disabled) {
				this.focusedIndex = index;
				return;
			}
			index++;
		}
	}

	private focusPreviousOption(): void {
		const options = this.filteredOptions;
		let index = this.focusedIndex - 1;
		while (index >= 0) {
			if (!options[index].disabled) {
				this.focusedIndex = index;
				return;
			}
			index--;
		}
	}

	private findFirstEnabledIndex(): number {
		return this.filteredOptions.findIndex((opt) => !opt.disabled);
	}

	private updateValues(values: string[]): void {
		this._syncingValues = true;
		this.values = values;
		this._syncingValues = false;
	}

	private areValuesEqual(left: string[], right: string[]): boolean {
		if (left.length !== right.length) return false;
		for (let i = 0; i < left.length; i++) {
			if (left[i] !== right[i]) return false;
		}
		return true;
	}
}
