import { MelodicComponent } from '@melodicdev/core';
import type { IElementRef, OnCreate, OnDestroy } from '@melodicdev/core';
import type { Size } from '../../../types/index.js';
import type { SelectOption } from './select.types.js';
import { computePosition, offset, flip, shift } from '../../../utils/positioning/index.js';
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
	public elementRef!: HTMLElement;

	/** Label text */
	public label = '';

	/** Placeholder text when no selection */
	public placeholder = 'Select an option';

	/** Hint text shown below select */
	public hint = '';

	/** Error message (shows error state when set) */
	public error = '';

	/** Select size */
	public size: Size = 'md';

	/** Disable the select */
	public disabled = false;

	/** Mark as required */
	public required = false;

	/** Enable multi-select mode */
	public multiple = false;

	/** Currently selected value */
	public value = '';

	/** Currently selected values (multi-select) */
	public values: string[] = [];

	/** Available options */
	public options: SelectOption[] = [];

	/** Search query for inline filtering */
	public search = '';

	/** Whether dropdown is open */
	public isOpen = false;

	/** Currently focused option index for keyboard navigation */
	public focusedIndex = -1;

	/** Bound event handlers for cleanup */
	private readonly _handleKeyDown = this.onKeyDown.bind(this);
	private readonly _handlePopoverToggle = this.onPopoverToggle.bind(this);
	private _handleScroll: ((event: Event) => void) | null = null;
	private _lastCloseTime = 0;
	private _syncingValues = false;

	public onCreate(): void {
		this.elementRef.addEventListener('keydown', this._handleKeyDown);
		this.getDropdownEl()?.addEventListener('toggle', this._handlePopoverToggle);
	}

	public onDestroy(): void {
		this.elementRef.removeEventListener('keydown', this._handleKeyDown);
		this.removeScrollListener();
		this.getDropdownEl()?.removeEventListener('toggle', this._handlePopoverToggle);
	}

	public onPropertyChange(name: string): void {
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
	public get selectedOption(): SelectOption | undefined {
		return this.options.find((opt) => opt.value === this.value);
	}

	/** Get the currently selected options (multi-select) */
	public get selectedOptions(): SelectOption[] {
		if (!this.multiple) {
			return this.selectedOption ? [this.selectedOption] : [];
		}

		return this.options.filter((opt) => this.values.includes(opt.value));
	}

	/** Get display text for trigger */
	public get displayText(): string {
		if (this.multiple) {
			return this.selectedOptions.map((option) => option.label).join(', ');
		}

		return this.selectedOption?.label || '';
	}

	public get filteredOptions(): SelectOption[] {
		const query = this.search.trim().toLowerCase();
		if (!query) return this.options;

		return this.options.filter((option) => {
			const labelMatch = option.label.toLowerCase().includes(query);
			const valueMatch = option.value.toLowerCase().includes(query);
			return labelMatch || valueMatch;
		});
	}

	public get hasValue(): boolean {
		return this.multiple ? this.values.length > 0 : !!this.value;
	}

	/** Toggle dropdown open/close */
	public toggle = (): void => {
		if (this.disabled) return;

		if (this.multiple) {
			if (!this.isOpen) {
				this.open();
			}
			return;
		}

		if (this.isOpen) {
			this.close();
		} else if (Date.now() - this._lastCloseTime > 150) {
			this.open();
		}
	};

	/** Open the dropdown */
	public open = (): void => {
		if (this.disabled || this.isOpen) return;
		this.getDropdownEl()?.showPopover();
	};

	/** Close the dropdown */
	public close = (): void => {
		if (!this.isOpen) return;
		this.getDropdownEl()?.hidePopover();
	};

	/** Select an option */
	public selectOption = (option: SelectOption): void => {
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
	public handleOptionClick = (event: Event, option: SelectOption): void => {
		event.stopPropagation();
		this.selectOption(option);
	};

	public handleTagRemove = (event: Event, value: string): void => {
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

	public handleSearchInput = (event: Event): void => {
		if (this.disabled) return;
		const target = event.target as HTMLInputElement;
		this.search = target.value;
		this.focusedIndex = this.findFirstEnabledIndex();
		if (!this.isOpen) {
			this.open();
		}
	};

	public handleSearchClick = (event: Event): void => {
		event.stopPropagation();
		if (!this.isOpen) {
			this.open();
		}
	};

	/** Handle popover toggle events (open/close via Popover API) */
	private onPopoverToggle(event: Event): void {
		const toggleEvent = event as ToggleEvent;

		if (toggleEvent.newState === 'open') {
			this.isOpen = true;
			this.focusedIndex = this.getInitialFocusIndex();
			this.positionDropdown();
			this.addScrollListener();
			this.elementRef.dispatchEvent(
				new CustomEvent('ml:open', { bubbles: true, composed: true })
			);
		} else {
			this.isOpen = false;
			this.focusedIndex = -1;
			this.search = '';
			this._lastCloseTime = Date.now();
			this.removeScrollListener();
			this.elementRef.dispatchEvent(
				new CustomEvent('ml:close', { bubbles: true, composed: true })
			);
		}
	}

	/** Position the dropdown relative to the trigger using fixed positioning */
	private positionDropdown(): void {
		const triggerEl = this.elementRef.shadowRoot?.querySelector('.ml-select__trigger') as HTMLElement | null;
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

	/** Close dropdown when any ancestor scrolls */
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
		return this.elementRef.shadowRoot?.querySelector('.ml-select__dropdown') as HTMLElement | null;
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
