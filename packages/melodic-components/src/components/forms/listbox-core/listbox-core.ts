import { registerAdapter } from '@melodicdev/core/forms';

/**
 * ListboxCore — shared internals for ml-select and ml-autocomplete.
 *
 * Both components keep a single `value`, a multi `values` array and a
 * `multiple` flag in step with each other, register the same forms adapter and
 * walk their option list the same way. That logic used to be copied into each
 * component — and the copies shared the same bug.
 *
 * INTERNAL: not exported from the package root — implementation detail only.
 */

/** The component state the value sync reads and writes. */
export interface ListboxValueHost {
	multiple: boolean;
	value: string;
	values: string[];
	search: string;
}

/** Minimal option shape needed for keyboard navigation. */
export interface ListboxOptionLike {
	disabled?: boolean;
}

/** Register the forms adapter shared by ml-select and ml-autocomplete. */
export function registerListboxAdapter(tagName: string): void {
	registerAdapter<string | string[]>((el) => el.tagName === tagName, {
		inputEvent: 'ml:change',
		blurEvent: 'focusout',
		getValue: (el) => {
			const e = el as unknown as { value: string; values?: string[]; multiple?: boolean };
			return e.multiple ? (e.values ?? []) : (e.value ?? '');
		},
		setValue: (el, value) => {
			const e = el as unknown as { value: string; values?: string[]; multiple?: boolean };
			if (Array.isArray(value)) e.values = value;
			else e.value = value !== null && value !== undefined ? String(value) : '';
		},
		setDisabled: (el, disabled) => {
			(el as unknown as { disabled: boolean }).disabled = disabled;
		}
	});
}

export function areValuesEqual(left: readonly string[], right: readonly string[]): boolean {
	if (left.length !== right.length) return false;
	for (let i = 0; i < left.length; i++) {
		if (left[i] !== right[i]) return false;
	}
	return true;
}

/**
 * Turn whatever was assigned to `values` into a de-duplicated string array.
 * Accepts an array (non-strings dropped) or a comma-separated string.
 */
export function normalizeValues(raw: unknown): string[] {
	let normalized: string[] = [];
	if (typeof raw === 'string') {
		normalized = raw
			.split(',')
			.map((value) => value.trim())
			.filter((value) => value.length > 0);
	} else if (Array.isArray(raw)) {
		normalized = raw.filter((value): value is string => typeof value === 'string');
	}
	return Array.from(new Set(normalized));
}

/**
 * Keeps `value`, `values` and `multiple` consistent.
 *
 * `onPropertyChange` fires BEFORE the new value is committed, so reading the
 * changing property off the host returns the OLD value. Everything here works
 * from the hook's `newValue` argument instead; reading the old state made
 * toggling `multiple` run the wrong branch, made `value` writes in multiple
 * mode lag one step behind, and never normalized `values` at all.
 */
export class ListboxValueSync {
	private _syncing = false;

	constructor(private readonly _host: ListboxValueHost) {}

	/** Call from the component's onPropertyChange. */
	public handlePropertyChange(name: string, newValue: unknown): void {
		if (this._syncing) {
			return;
		}

		if (name === 'multiple') {
			this.handleMultipleChange(!!newValue);
			return;
		}

		if (name === 'values') {
			this.handleValuesChange(newValue);
			return;
		}

		if (name === 'value' && this._host.multiple && newValue) {
			const next = Array.from(new Set([...normalizeValues(this._host.values), String(newValue)]));
			if (!areValuesEqual(this._host.values, next)) {
				this.write(() => {
					this._host.values = next;
				});
			}
		}
	}

	private handleMultipleChange(multiple: boolean): void {
		const host = this._host;
		const values = normalizeValues(host.values);

		this.write(() => {
			if (multiple) {
				// Entering multiple mode: carry the single value over.
				if (!values.length && host.value) {
					host.values = [host.value];
				}
				return;
			}

			// Leaving multiple mode: keep the first selection as the value.
			if (values.length) {
				host.value = values[0] ?? '';
			}
			host.values = [];
			host.search = '';
		});
	}

	private handleValuesChange(raw: unknown): void {
		const host = this._host;
		const normalized = normalizeValues(raw);

		// The incoming value itself cannot be replaced from inside the hook
		// (the setter commits it right after), so a value that needs
		// normalizing — a comma-separated string, duplicates, non-strings — is
		// rewritten once it has landed.
		const needsRewrite = !Array.isArray(raw) || !areValuesEqual(raw as string[], normalized);
		if (needsRewrite) {
			queueMicrotask(() => {
				if (host.values === raw) {
					this.write(() => {
						host.values = normalized;
					});
				}
			});
		}

		// In single mode `values` is only a staging area (it is adopted when
		// `multiple` turns on); mirror its first entry onto `value`.
		if (!host.multiple && normalized.length) {
			this.write(() => {
				host.value = normalized[0];
			});
		}
	}

	private write(fn: () => void): void {
		this._syncing = true;
		try {
			fn();
		} finally {
			this._syncing = false;
		}
	}
}

// ── Option navigation ─────────────────────────────────────────────────────────

/** Index of the next enabled option after `from`, or -1 when there is none. */
export function findNextEnabledIndex(options: readonly ListboxOptionLike[], from: number): number {
	for (let index = from + 1; index < options.length; index++) {
		if (!options[index].disabled) return index;
	}
	return -1;
}

/** Index of the previous enabled option before `from`, or -1 when there is none. */
export function findPreviousEnabledIndex(options: readonly ListboxOptionLike[], from: number): number {
	for (let index = from - 1; index >= 0; index--) {
		if (!options[index].disabled) return index;
	}
	return -1;
}

export function findFirstEnabledIndex(options: readonly ListboxOptionLike[]): number {
	return options.findIndex((option) => !option.disabled);
}

export function findLastEnabledIndex(options: readonly ListboxOptionLike[]): number {
	return findPreviousEnabledIndex(options, options.length);
}

/** Scroll the option element with `id` into view inside its dropdown. */
export function scrollOptionIntoView(root: ShadowRoot | null | undefined, id: string): void {
	const optionEl = root?.getElementById(id);
	if (optionEl && typeof optionEl.scrollIntoView === 'function') {
		optionEl.scrollIntoView({ block: 'nearest' });
	}
}
