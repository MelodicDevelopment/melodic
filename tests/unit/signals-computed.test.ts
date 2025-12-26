import { describe, it, expect } from 'vitest';
import { signal, computed } from '../../src/signals';


describe('computed signals', () => {
	it('switches dependencies when conditions change', () => {
		const usePrimary = signal(true);
		const primary = signal(1);
		const secondary = signal(2);

		const value = computed(() => (usePrimary() ? primary() : secondary()));

		expect(value()).toBe(1);
		secondary.set(3);
		expect(value()).toBe(1);

		usePrimary.set(false);
		expect(value()).toBe(3);

		primary.set(9);
		expect(value()).toBe(3);
	});

	it('stops reacting after destroy', () => {
		const count = signal(1);
		const doubled = computed(() => count() * 2);

		expect(doubled()).toBe(2);
		doubled.destroy();

		count.set(5);
		expect(doubled()).toBe(2);
	});
});
