// INTERNAL shared core for ml-select / ml-autocomplete — not exported from the package root.
export {
	ListboxValueSync,
	registerListboxAdapter,
	areValuesEqual,
	normalizeValues,
	findNextEnabledIndex,
	findPreviousEnabledIndex,
	findFirstEnabledIndex,
	findLastEnabledIndex,
	scrollOptionIntoView
} from './listbox-core.js';
export type { ListboxValueHost, ListboxOptionLike } from './listbox-core.js';
