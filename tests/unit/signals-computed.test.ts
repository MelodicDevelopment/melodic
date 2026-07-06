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

	it('throws on read after destroy and stops reacting to upstream changes', () => {
		const count = signal(1);
		const doubled = computed(() => count() * 2);

		expect(doubled()).toBe(2);
		doubled.destroy();

		// Upstream changes are no longer propagated (effect is destroyed) and
		// reading the destroyed computed throws so a stale-reference bug surfaces
		// at the access site instead of returning silently-stale data.
		count.set(5);
		expect(() => doubled()).toThrow(/destruction/);
	});

	it('destroy is idempotent', () => {
		const count = signal(1);
		const doubled = computed(() => count() * 2);

		doubled.destroy();
		expect(() => doubled.destroy()).not.toThrow();
	});

	it('is lazy: does not compute at creation nor on source change, only on read', () => {
		const count = signal(1);
		let computations = 0;
		const doubled = computed(() => {
			computations++;
			return count() * 2;
		});

		// Creation does not evaluate.
		expect(computations).toBe(0);

		// Source changes while unread do not evaluate.
		count.set(2);
		count.set(3);
		expect(computations).toBe(0);

		// First read evaluates once with current sources.
		expect(doubled()).toBe(6);
		expect(computations).toBe(1);

		// Clean reads do not re-evaluate.
		expect(doubled()).toBe(6);
		expect(computations).toBe(1);

		// A source change marks dirty but does not eagerly recompute...
		count.set(4);
		expect(computations).toBe(1);

		// ...until the next read.
		expect(doubled()).toBe(8);
		expect(computations).toBe(2);
	});

	it('is read-only: set() and update() throw at runtime', () => {
		const count = signal(1);
		const doubled = computed(() => count() * 2);

		// @ts-expect-error — computed signals are read-only at the type level
		expect(() => doubled.set(99)).toThrow(/read-only|derived/i);
		// @ts-expect-error — computed signals are read-only at the type level
		expect(() => doubled.update((v: number) => v + 1)).toThrow(/read-only|derived/i);

		// The failed writes did not corrupt the derived value.
		expect(doubled()).toBe(2);
	});

	it('notifies direct subscribers with the fresh value when a source changes', () => {
		const count = signal(1);
		const doubled = computed(() => count() * 2);

		const seen: number[] = [];
		const unsub = doubled.subscribe((v) => seen.push(v));

		count.set(2);
		expect(seen).toEqual([4]);

		// Equality-gated: recomputing to the same value does not notify.
		count.update((n) => n);
		expect(seen).toEqual([4]);

		unsub();
		count.set(5);
		expect(seen).toEqual([4]);
	});

	it('subscribe establishes source tracking on a never-read computed', () => {
		const count = signal(1);
		const doubled = computed(() => count() * 2);

		let latest: number | undefined;
		doubled.subscribe((v) => {
			latest = v;
		});

		// Without eager tracking at subscribe time this change would be lost.
		count.set(10);
		expect(latest).toBe(20);
	});
});
