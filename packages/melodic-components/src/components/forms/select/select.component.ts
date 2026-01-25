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
 * ```
 *
 * @fires ml-change - Emitted when selection changes
 * @fires ml-open - Emitted when dropdown opens
 * @fires ml-close - Emitted when dropdown closes
 */
@MelodicComponent({
	selector: 'ml-select',
	template: selectTemplate,
	styles: selectStyles,
	attributes: ['label', 'placeholder', 'hint', 'error', 'size', 'disabled', 'required', 'value']
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

	/** Currently selected value */
	value = '';

	/** Available options */
	options: SelectOption[] = [];

	/** Whether dropdown is open */
	isOpen = false;

	/** Currently focused option index for keyboard navigation */
	focusedIndex = -1;

	/** Bound event handlers for cleanup */
	private readonly _handleDocumentClick = this.onDocumentClick.bind(this);
	private readonly _handleKeyDown = this.onKeyDown.bind(this);

	onCreate(): void {
		document.addEventListener('click', this._handleDocumentClick);
		this.elementRef.addEventListener('keydown', this._handleKeyDown);
	}

	onDestroy(): void {
		document.removeEventListener('click', this._handleDocumentClick);
		this.elementRef.removeEventListener('keydown', this._handleKeyDown);
	}

	/** Get the currently selected option */
	get selectedOption(): SelectOption | undefined {
		return this.options.find((opt) => opt.value === this.value);
	}

	/** Get display text for trigger */
	get displayText(): string {
		return this.selectedOption?.label || '';
	}

	/** Toggle dropdown open/close */
	toggle = (): void => {
		if (this.disabled) return;

		if (this.isOpen) {
			this.close();
		} else {
			this.open();
		}
	};

	/** Open the dropdown */
	open = (): void => {
		if (this.disabled || this.isOpen) return;

		this.isOpen = true;
		this.focusedIndex = this.value ? this.options.findIndex((opt) => opt.value === this.value) : 0;

		this.elementRef.dispatchEvent(
			new CustomEvent('ml-open', {
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

		this.elementRef.dispatchEvent(
			new CustomEvent('ml-close', {
				bubbles: true,
				composed: true
			})
		);
	};

	/** Select an option */
	selectOption = (option: SelectOption): void => {
		if (option.disabled) return;

		this.value = option.value;
		this.close();

		this.elementRef.dispatchEvent(
			new CustomEvent('ml-change', {
				bubbles: true,
				composed: true,
				detail: { value: this.value, option }
			})
		);
	};

	/** Handle click on option */
	handleOptionClick = (event: Event, option: SelectOption): void => {
		event.stopPropagation();
		this.selectOption(option);
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

		switch (event.key) {
			case 'Enter':
			case ' ':
				event.preventDefault();
				if (this.isOpen && this.focusedIndex >= 0) {
					const option = this.options[this.focusedIndex];
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

		while (index < this.options.length) {
			if (!this.options[index].disabled) {
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

		while (index >= 0) {
			if (!this.options[index].disabled) {
				this.focusedIndex = index;
				return;
			}
			index--;
		}
	}

	/** Find first enabled option index */
	private findFirstEnabledIndex(): number {
		return this.options.findIndex((opt) => !opt.disabled);
	}

	/** Find last enabled option index */
	private findLastEnabledIndex(): number {
		for (let i = this.options.length - 1; i >= 0; i--) {
			if (!this.options[i].disabled) {
				return i;
			}
		}
		return -1;
	}
}
