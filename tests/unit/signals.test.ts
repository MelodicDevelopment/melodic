import { describe, it, expect } from 'vitest';
import { computed, signal } from '../../src/signals';


describe('signals', () => {
	it('updates subscribers on set', () => {
		const count = signal(0);
		let latest = count();

		const unsubscribe = count.subscribe((value) => {
			latest = value ?? 0;
		});

		count.set(2);
		expect(latest).toBe(2);

		unsubscribe();
		count.set(3);
		expect(latest).toBe(2);
	});

	it('throws on read/set/update/subscribe after destroy', () => {
		const s = signal(0);
		s.destroy();

		expect(() => s()).toThrow(/destruction/);
		expect(() => s.set(1)).toThrow(/destruction/);
		expect(() => s.update((v) => (v ?? 0) + 1)).toThrow(/destruction/);
		expect(() => s.subscribe(() => {})).toThrow(/destruction/);
	});

	it('unsubscribers returned before destroy are safe to call after destroy', () => {
		const s = signal(0);
		const unsub = s.subscribe(() => {});
		s.destroy();
		expect(() => unsub()).not.toThrow();
		expect(() => s.unsubscribe(() => {})).not.toThrow();
	});

	it('computed tracks dependencies', () => {
		const a = signal(2);
		const b = signal(3);
		const sum = computed(() => a() + b());

		expect(sum()).toBe(5);
		a.set(5);
		expect(sum()).toBe(8);
	});
});
