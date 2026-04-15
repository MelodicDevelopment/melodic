import type { FormControlAdapter, AdapterPredicate } from '../types/adapter.types';

type Entry = {
	predicate: AdapterPredicate;
	adapter: FormControlAdapter;
};

const registry: Entry[] = [];

export function registerAdapter<T = unknown>(predicate: AdapterPredicate, adapter: FormControlAdapter<T>): void {
	registry.unshift({ predicate, adapter: adapter as FormControlAdapter });
}

export function getAdapter(element: Element): FormControlAdapter | undefined {
	for (const entry of registry) {
		if (entry.predicate(element)) {
			return entry.adapter;
		}
	}
	return undefined;
}

export function clearAdapters(): void {
	registry.length = 0;
}
