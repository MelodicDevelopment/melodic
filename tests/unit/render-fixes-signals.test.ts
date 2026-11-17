import { describe, it, expect } from 'vitest';
import { signal, computed, effect, batch } from '../../src/signals';

describe('review 2026-11 — signals', () => {
	it('a computed that threw wakes its dependents when the source changes', () => {
		const source = signal(0);
		const derived = computed(() => {
			if (source() === 0) {
				throw new Error('boom');
			}
			return source();
		});

		const seen: unknown[] = [];
		const ref = effect(() => {
			try {
				seen.push(derived());
			} catch {
				seen.push('error');
			}
		});

		source.set(1);
		expect(seen).toEqual(['error', 1]);

		// And it keeps working through a second failure.
		source.set(0);
		source.set(2);
		expect(seen).toEqual(['error', 1, 'error', 2]);
		ref.destroy();
	});

	it('a computed that threw still notifies direct subscribers afterwards', () => {
		const source = signal(1);
		const derived = computed(() => {
			if (source() === 0) {
				throw new Error('boom');
			}
			return source() * 10;
		});
		const seen: number[] = [];
		derived.subscribe((value) => seen.push(value));

		expect(() => source.set(0)).toThrow('boom');
		source.set(3);
		expect(seen).toEqual([30]);
	});

	it('batch() inside an effect does not break coalescing for the rest of the flush', () => {
		const trigger = signal(0);
		const inner = signal(0);
		const a = signal(0);
		const b = signal(0);
		let runs = 0;

		effect(() => {
			a();
			b();
			runs++;
		});
		effect(() => {
			const value = trigger();
			if (value > 0) {
				batch(() => inner.set(value));
				a.set(value);
				b.set(value);
			}
		});

		runs = 0;
		trigger.set(1);
		expect(runs).toBe(1);
	});

	it('batch() inside an effect still applies its writes', () => {
		const trigger = signal(0);
		const target = signal(0);
		const seen: number[] = [];
		effect(() => {
			seen.push(target());
		});
		effect(() => {
			const value = trigger();
			batch(() => target.set(value * 2));
		});

		trigger.set(4);
		expect(seen).toEqual([0, 8]);
	});

	it('a computed that reads itself reports a cycle instead of overflowing the stack', () => {
		// eslint-disable-next-line prefer-const
		let self: () => number;
		const cyclic = computed((): number => self() + 1, { name: 'cyclic' });
		self = cyclic;

		expect(() => cyclic()).toThrow(/Circular dependency detected in computed 'cyclic'/);
	});

	it('a cycle through two computeds is reported too', () => {
		// eslint-disable-next-line prefer-const
		let second: () => number;
		const first = computed((): number => second() + 1);
		second = computed((): number => first() + 1);

		expect(() => first()).toThrow(/Circular dependency detected in computed/);
	});
});
