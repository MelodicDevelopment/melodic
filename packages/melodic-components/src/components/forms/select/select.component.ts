import { MelodicComponent } from '@melodicdev/core';
import type { IElementRef, OnCreate, OnDestroy } from '@melodicdev/core';
import type { Size } from '../../../types/index.js';
import type { SelectOption } from './select.types.js';
import { OverlayPositioner } from '../../../utils/overlay/index.js';
import { newID } from '../../../functions/index.js';
import {
	ListboxValueSync,
	registerListboxAdapter,
	findNextEnabledIndex,
	findPreviousEnabledIndex,
	findFirstEnabledIndex as firstEnabledIndex,
	findLastEnabledIndex as lastEnabledIndex,
	scrollOptionIntoView
} from '../listbox-core/index.js';
import { selectTemplate } from './select.template.js';
import { selectStyles } from './select.styles.js';

registerListboxAdapter('ML-SELECT');

/** Idle time after which the typeahead buffer resets (matches native select behavior) */
const TYPEAHEAD_RESET_MS = 700;

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
	private readonly _uid = newID();
	private readonly _positioner = new OverlayPositioner(() => ({
		placement: 'bottom-start',
		offset: 4,
		matchTriggerWidth: true
	}));
	private _lastCloseTime = 0;
	/** Keeps value / values / multiple consistent (shared with ml-autocomplete). */
	private readonly _valueSync = new ListboxValueSync(this);
	private _typeaheadBuffer = '';
	private _typeaheadLastTime = 0;

	public onCreate(): void {
		this.elementRef.addEventListener('keydown', this._handleKeyDown);
		this.getDropdownEl()?.addEventListener('toggle', this._handlePopoverToggle);
	}

	public onDestroy(): void {
		this.elementRef.removeEventListener('keydown', this._handleKeyDown);
		this.stopPositioning();
		this.getDropdownEl()?.removeEventListener('toggle', this._handlePopoverToggle);
	}

	public onPropertyChange(name: string, _: unknown, newValue: unknown): void {
		this._valueSync.handlePropertyChange(name, newValue);
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

	/** Unique id of the label element (for aria-labelledby) */
	public get labelId(): string {
		return `ml-select-label-${this._uid}`;
	}

	/** Unique id of the error element (for aria-describedby) */
	public get errorId(): string {
		return `ml-select-error-${this._uid}`;
	}

	/** Unique id of the hint element (for aria-describedby) */
	public get hintId(): string {
		return `ml-select-hint-${this._uid}`;
	}

	/**
	 * Id of the message that describes the control, or undefined when there is
	 * none. The error replaces the hint visually, so it does here too.
	 */
	public get describedBy(): string | undefined {
		if (this.error) return this.errorId;
		if (this.hint) return this.hintId;
		return undefined;
	}

	/** Unique id of the listbox element (for aria-controls) */
	public get listboxId(): string {
		return `ml-select-listbox-${this._uid}`;
	}

	/** Unique id for the option at the given display index */
	public optionId = (index: number): string => {
		return `${this.listboxId}-option-${index}`;
	};

	/** Id of the keyboard-focused option, or undefined when none (omits the attribute) */
	public get activeDescendant(): string | undefined {
		return this.isOpen && this.focusedIndex >= 0 ? this.optionId(this.focusedIndex) : undefined;
	}

	/** Toggle dropdown open/close */
	public toggle = (): void => {
		if (this.disabled) return;

		if (this.isOpen) {
			this.close();
		} else if (Date.now() - this._lastCloseTime > 150) {
			this.open();
		}

		// In multiple mode the search input is the combobox (and the only tab
		// stop), so a click anywhere on the trigger must land focus there.
		if (this.multiple) {
			(this.elementRef.shadowRoot?.querySelector('.ml-select__search') as HTMLElement | null)?.focus();
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
			this.startPositioning();
			this.elementRef.dispatchEvent(
				new CustomEvent('ml:open', { bubbles: true, composed: true })
			);
		} else {
			this.isOpen = false;
			this.focusedIndex = -1;
			this.search = '';
			this._typeaheadBuffer = '';
			this._lastCloseTime = Date.now();
			this.stopPositioning();
			this.elementRef.dispatchEvent(
				new CustomEvent('ml:close', { bubbles: true, composed: true })
			);
		}
	}

	/** Keep the dropdown positioned while open (repositions on scroll/resize). */
	private startPositioning(): void {
		const triggerEl = this.elementRef.shadowRoot?.querySelector('.ml-select__trigger') as HTMLElement | null;
		const dropdownEl = this.getDropdownEl();
		if (!triggerEl || !dropdownEl) return;

		this._positioner.start(triggerEl, dropdownEl);
	}

	private stopPositioning(): void {
		this._positioner.stop();
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
				// Space types a space in the search box, but Enter must commit
				// the focused option from there too — in multiple mode the
				// search input holds focus for the whole interaction, so Enter
				// could not select anything at all.
				if (isSearchInput && (event.key === ' ' || !this.isOpen || this.focusedIndex < 0)) {
					return;
				}
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
				// Only claim Escape while the listbox is actually open.
				// preventDefault() on a closed control cancelled the platform's
				// close-watcher, so an enclosing dialog or drawer could not be
				// dismissed with Escape while focus sat on this field.
				if (!this.isOpen) {
					return;
				}
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
					this.scrollFocusedOptionIntoView();
				}
				break;

			case 'End':
				event.preventDefault();
				if (this.isOpen) {
					this.focusedIndex = this.findLastEnabledIndex();
					this.scrollFocusedOptionIntoView();
				}
				break;

			case 'Tab':
				this.close();
				break;

			default:
				if (!isSearchInput) {
					this.handleTypeahead(event);
				}
				break;
		}
	}

	/** Native-select-style type-to-jump: accumulate printable characters and jump to the matching option */
	private handleTypeahead(event: KeyboardEvent): void {
		if (event.key.length !== 1 || event.ctrlKey || event.metaKey || event.altKey) return;

		event.preventDefault();

		const now = Date.now();
		if (now - this._typeaheadLastTime > TYPEAHEAD_RESET_MS) {
			this._typeaheadBuffer = '';
		}
		this._typeaheadLastTime = now;
		this._typeaheadBuffer += event.key.toLowerCase();

		// Repeated presses of the same letter cycle through its matches instead of matching "mm..."
		const isRepeatedChar =
			this._typeaheadBuffer.length > 1 &&
			this._typeaheadBuffer.split('').every((char) => char === this._typeaheadBuffer[0]);
		const query = isRepeatedChar ? this._typeaheadBuffer[0] : this._typeaheadBuffer;

		const options = this.getActiveOptions();
		const startIndex = this.isOpen
			? this.focusedIndex
			: options.findIndex((opt) => opt.value === this.value);
		const matchIndex = this.findTypeaheadMatch(query, startIndex);
		if (matchIndex < 0) return;

		if (this.isOpen) {
			this.focusedIndex = matchIndex;
			this.scrollFocusedOptionIntoView();
			return;
		}

		if (this.multiple) return;

		this.selectOption(options[matchIndex]);
	}

	/** Find the first enabled option whose label starts with query, searching forward from startIndex + 1 and wrapping */
	private findTypeaheadMatch(query: string, startIndex: number): number {
		const options = this.getActiveOptions();

		for (let offset = 1; offset <= options.length; offset++) {
			const index = (startIndex + offset) % options.length;
			const option = options[index];
			if (!option.disabled && option.label.toLowerCase().startsWith(query)) {
				return index;
			}
		}
		return -1;
	}

	/** Keep the keyboard-focused option visible within the scrollable dropdown */
	private scrollFocusedOptionIntoView(): void {
		if (this.focusedIndex < 0) return;
		scrollOptionIntoView(this.elementRef.shadowRoot, this.optionId(this.focusedIndex));
	}

	/** Move focus to next enabled option */
	private focusNextOption(): void {
		const index = findNextEnabledIndex(this.getActiveOptions(), this.focusedIndex);
		if (index >= 0) {
			this.focusedIndex = index;
			this.scrollFocusedOptionIntoView();
		}
	}

	/** Move focus to previous enabled option */
	private focusPreviousOption(): void {
		const index = findPreviousEnabledIndex(this.getActiveOptions(), this.focusedIndex);
		if (index >= 0) {
			this.focusedIndex = index;
			this.scrollFocusedOptionIntoView();
		}
	}

	/** Find first enabled option index */
	private findFirstEnabledIndex(): number {
		return firstEnabledIndex(this.getActiveOptions());
	}

	/** Find last enabled option index */
	private findLastEnabledIndex(): number {
		return lastEnabledIndex(this.getActiveOptions());
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
}
