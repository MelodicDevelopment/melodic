import { MelodicComponent } from '@melodicdev/core';
import type { IElementRef, OnCreate, OnDestroy } from '@melodicdev/core';
import type { Size } from '../../../types/index.js';
import type { SelectOption } from './select.types.js';
import { selectTemplate } from './select.template.js';
import { selectStyles } from './select.styles.js';

/**
 * ml-select - Custom select/dropdown component
 *
 * @example
 * ```html
 * <ml-select
 *   label="Country"
 *   placeholder="Select a country"
 *   .options=${[
 *     { value: 'us', label: 'United States' },
 *     { value: 'ca', label: 'Canada' },
 *     { value: 'mx', label: 'Mexico' }
 *   ]}
 * ></ml-select>
 *
 * <ml-select
 *   label="Countries"
 *   placeholder="Select countries"
 *   multiple
 *   .values=${['us', 'ca']}
 *   .options=${[
 *     { value: 'us', label: 'United States' },
 *     { value: 'ca', label: 'Canada' },
 *     { value: 'mx', label: 'Mexico' }
 *   ]}
 * ></ml-select>
 * ```
 *
 * @fires ml:change - Emitted when selection changes
 * @fires ml:open - Emitted when dropdown opens
 * @fires ml:close - Emitted when dropdown closes
 */
@MelodicComponent({
	selector: 'ml-select',
	template: selectTemplate,
	styles: selectStyles,
	attributes: ['label', 'placeholder', 'hint', 'error', 'size', 'disabled', 'required', 'value', 'multiple']
})
export class SelectComponent implements IElementRef, OnCreate, OnDestroy {
	elementRef!: HTMLElement;

	/** Label text */
	label = '';

	/** Placeholder text when no selection */
	placeholder = 'Select an option';

	/** Hint text shown below select */
	hint = '';

	/** Error message (shows error state when set) */
	error = '';

	/** Select size */
	size: Size = 'md';

	/** Disable the select */
	disabled = false;

	/** Mark as required */
	required = false;

	/** Enable multi-select mode */
	multiple = false;

	/** Currently selected value */
	value = '';

	/** Currently selected values (multi-select) */
	values: string[] = [];

	/** Available options */
	options: SelectOption[] = [];

	/** Search query for inline filtering */
	search = '';

	/** Whether dropdown is open */
	isOpen = false;

	/** Currently focused option index for keyboard navigation */
	focusedIndex = -1;

	/** Bound event handlers for cleanup */
	private readonly _handleDocumentClick = this.onDocumentClick.bind(this);
	private readonly _handleKeyDown = this.onKeyDown.bind(this);
	private _syncingValues = false;

	onCreate(): void {
		document.addEventListener('click', this._handleDocumentClick);
		this.elementRef.addEventListener('keydown', this._handleKeyDown);
	}

	onDestroy(): void {
		document.removeEventListener('click', this._handleDocumentClick);
		this.elementRef.removeEventListener('keydown', this._handleKeyDown);
	}

	onPropertyChange(name: string): void {
		if (this._syncingValues) {
			return;
		}

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
					.map((value) => value.trim())
					.filter((value) => value.length > 0);
			} else if (Array.isArray(rawValues)) {
				normalized = rawValues.filter((value) => typeof value === 'string');
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

	/** Get the currently selected option */
	get selectedOption(): SelectOption | undefined {
		return this.options.find((opt) => opt.value === this.value);
	}

	/** Get the currently selected options (multi-select) */
	get selectedOptions(): SelectOption[] {
		if (!this.multiple) {
			return this.selectedOption ? [this.selectedOption] : [];
		}

		return this.options.filter((opt) => this.values.includes(opt.value));
	}

	/** Get display text for trigger */
	get displayText(): string {
		if (this.multiple) {
			return this.selectedOptions.map((option) => option.label).join(', ');
		}

		return this.selectedOption?.label || '';
	}

	get filteredOptions(): SelectOption[] {
		const query = this.search.trim().toLowerCase();
		if (!query) return this.options;

		return this.options.filter((option) => {
			const labelMatch = option.label.toLowerCase().includes(query);
			const valueMatch = option.value.toLowerCase().includes(query);
			return labelMatch || valueMatch;
		});
	}

	get hasValue(): boolean {
		return this.multiple ? this.values.length > 0 : !!this.value;
	}

	/** Toggle dropdown open/close */
	toggle = (): void => {
		if (this.disabled) return;

		if (this.multiple) {
			if (!this.isOpen) {
				this.open();
			}
			return;
		}

		if (this.isOpen) {
			this.close();
			return;
		}

		this.open();
	};

	/** Open the dropdown */
	open = (): void => {
		if (this.disabled || this.isOpen) return;

		this.isOpen = true;
		this.focusedIndex = this.getInitialFocusIndex();

		this.elementRef.dispatchEvent(
			new CustomEvent('ml:open', {
				bubbles: true,
				composed: true
			})
		);
	};

	/** Close the dropdown */
	close = (): void => {
		if (!this.isOpen) return;

		this.isOpen = false;
		this.focusedIndex = -1;
		this.search = '';

		this.elementRef.dispatchEvent(
			new CustomEvent('ml:close', {
				bubbles: true,
				composed: true
			})
		);
	};

	/** Select an option */
	selectOption = (option: SelectOption): void => {
		if (option.disabled) return;

		if (this.multiple) {
			this.toggleOption(option);
			return;
		}

		this.value = option.value;
		this.close();

		this.elementRef.dispatchEvent(
			new CustomEvent('ml:change', {
				bubbles: true,
				composed: true,
				detail: { value: this.value, option }
			})
		);
	};

	/** Toggle a value in multi-select mode */
	private toggleOption(option: SelectOption): void {
		const exists = this.values.includes(option.value);
		this.values = exists ? this.values.filter((value) => value !== option.value) : [...this.values, option.value];

		this.elementRef.dispatchEvent(
			new CustomEvent('ml:change', {
				bubbles: true,
				composed: true,
				detail: { values: [...this.values], options: this.selectedOptions, option }
			})
		);
	}

	/** Handle click on option */
	handleOptionClick = (event: Event, option: SelectOption): void => {
		event.stopPropagation();
		this.selectOption(option);
	};

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

	handleSearchInput = (event: Event): void => {
		if (this.disabled) return;
		const target = event.target as HTMLInputElement;
		this.search = target.value;
		this.focusedIndex = this.findFirstEnabledIndex();
		if (!this.isOpen) {
			this.open();
		}
	};

	handleSearchClick = (event: Event): void => {
		event.stopPropagation();
		if (!this.isOpen) {
			this.open();
		}
	};

	/** Handle clicks outside to close dropdown */
	private onDocumentClick(event: Event): void {
		const path = event.composedPath();
		if (!path.includes(this.elementRef)) {
			this.close();
		}
	}

	/** Handle keyboard navigation */
	private onKeyDown(event: KeyboardEvent): void {
		if (this.disabled) return;

		const target = event.target as HTMLElement | null;
		const isSearchInput = target?.classList?.contains('ml-select__search') ?? false;

		switch (event.key) {
			case 'Enter':
			case ' ':
				if (isSearchInput) return;
				event.preventDefault();
				if (this.isOpen && this.focusedIndex >= 0) {
					const option = this.getActiveOptions()[this.focusedIndex];
					if (option && !option.disabled) {
						this.selectOption(option);
					}
				} else {
					this.toggle();
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

			case 'Home':
				event.preventDefault();
				if (this.isOpen) {
					this.focusedIndex = this.findFirstEnabledIndex();
				}
				break;

			case 'End':
				event.preventDefault();
				if (this.isOpen) {
					this.focusedIndex = this.findLastEnabledIndex();
				}
				break;

			case 'Tab':
				this.close();
				break;

			default:
				break;
		}
	}

	/** Move focus to next enabled option */
	private focusNextOption(): void {
		const startIndex = this.focusedIndex;
		let index = startIndex + 1;
		const options = this.getActiveOptions();

		while (index < options.length) {
			if (!options[index].disabled) {
				this.focusedIndex = index;
				return;
			}
			index++;
		}
	}

	/** Move focus to previous enabled option */
	private focusPreviousOption(): void {
		const startIndex = this.focusedIndex;
		let index = startIndex - 1;
		const options = this.getActiveOptions();

		while (index >= 0) {
			if (!options[index].disabled) {
				this.focusedIndex = index;
				return;
			}
			index--;
		}
	}

	/** Find first enabled option index */
	private findFirstEnabledIndex(): number {
		return this.getActiveOptions().findIndex((opt) => !opt.disabled);
	}

	/** Find last enabled option index */
	private findLastEnabledIndex(): number {
		const options = this.getActiveOptions();
		for (let i = options.length - 1; i >= 0; i--) {
			if (!options[i].disabled) {
				return i;
			}
		}
		return -1;
	}

	private getInitialFocusIndex(): number {
		const options = this.getActiveOptions();

		if (this.multiple && this.values.length > 0) {
			const selectedIndex = options.findIndex((opt) => this.values.includes(opt.value) && !opt.disabled);
			if (selectedIndex >= 0) {
				return selectedIndex;
			}
		}

		if (!this.multiple && this.value) {
			const selectedIndex = options.findIndex((opt) => opt.value === this.value && !opt.disabled);
			if (selectedIndex >= 0) {
				return selectedIndex;
			}
		}

		return this.findFirstEnabledIndex();
	}

	private getActiveOptions(): SelectOption[] {
		return this.filteredOptions;
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
