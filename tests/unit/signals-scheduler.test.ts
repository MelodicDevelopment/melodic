import { describe, it, expect, vi } from 'vitest';
import { signal, computed, batch, SignalEffect } from '../../src/signals';

/**
 * Regressions from the September 2026 review: the scheduler separates
 * invalidation (synchronous marking) from execution (deferred until the
 * write / batch completes), bounds effect re-runs per flush, isolates
 * subscriber failures and honours destroy() on queued effects.
 */
describe('signal scheduler: consistency', () => {
	it('diamond dependencies notify observers only with consistent values', () => {
		const a = signal(1);
		const left = computed(() => a() * 2);
		const right = computed(() => a() * 3);
		const values: number[] = [];

		const effect = new SignalEffect(() => values.push(left() + right()));
		effect.run();
		a.set(2);

		effect.destroy();
		left.destroy();
		right.destroy();

		// Previously [5, 7, 10]: the 7 combined the new left with the stale right.
		expect(values).toEqual([5, 10]);
	});

	it('deep diamonds stay consistent through several computed layers', () => {
		const a = signal(1);
		const b = computed(() => a() + 1);
		const c = computed(() => b() * 10);
		const d = computed(() => a() * 100);
		const seen: number[] = [];

		const effect = new SignalEffect(() => seen.push(c() + d()));
		effect.run();
		a.set(2);
		a.set(3);

		expect(seen).toEqual([120, 230, 340]);
		effect.destroy();
	});

	it('computed reads reflect writes made earlier in the same batch', () => {
		const a = signal(1);
		const double = computed(() => a() * 2);
		expect(double()).toBe(2);

		let inside = 0;
		batch(() => {
			a.set(2);
			inside = double();
		});

		double.destroy();
		expect(inside).toBe(4);
	});

	it('still recomputes a dependent computed once per batch', () => {
		const first = signal(1);
		const second = signal(1);
		let computations = 0;
		const sum = computed(() => (computations++, first() + second()));
		const seen: number[] = [];
		const effect = new SignalEffect(() => seen.push(sum()));
		effect.run();

		batch(() => {
			first.set(10);
			second.set(20);
		});

		expect(seen).toEqual([2, 30]);
		expect(computations).toBe(2);
		effect.destroy();
	});

	it('computed subscribers fire once with the fresh value after a batch', () => {
		const a = signal(1);
		const b = signal(1);
		const sum = computed(() => a() + b());
		const subscriber = vi.fn();
		sum.subscribe(subscriber);

		batch(() => {
			a.set(5);
			b.set(6);
		});

		expect(subscriber).toHaveBeenCalledTimes(1);
		expect(subscriber).toHaveBeenCalledWith(11);
		sum.destroy();
	});
});

describe('signal scheduler: robustness', () => {
	it('applies the circular-effect limit across queue passes inside a batch', () => {
		const a = signal(0);
		const effect = new SignalEffect(() => {
			const n = a();
			if (n > 0 && n < 100000) {
				a.set(n + 1);
			}
		});
		effect.run();

		expect(() => batch(() => a.set(1))).toThrow(/circular dependency/i);
		effect.destroy();

		// The scheduler is usable again after the abort.
		const b = signal(0);
		const seen = vi.fn();
		b.subscribe(seen);
		b.set(1);
		expect(seen).toHaveBeenCalledWith(1);
	});

	it('a thrown subscriber does not suppress sibling notifications in a batch', () => {
		const a = signal(0);
		const b = signal(0);
		const seen = vi.fn();

		a.subscribe(() => {
			throw new Error('bad subscriber');
		});
		b.subscribe(seen);

		expect(() =>
			batch(() => {
				a.set(1);
				b.set(1);
			})
		).toThrow('bad subscriber');
		expect(seen).toHaveBeenCalledWith(1);
	});

	it('a thrown subscriber does not skip later subscribers of the same signal', () => {
		const a = signal(0);
		const seen = vi.fn();
		a.subscribe(() => {
			throw new Error('first');
		});
		a.subscribe(seen);

		expect(() => a.set(1)).toThrow('first');
		expect(seen).toHaveBeenCalledWith(1);
	});

	it('aggregates several subscriber failures', () => {
		const a = signal(0);
		a.subscribe(() => {
			throw new Error('one');
		});
		a.subscribe(() => {
			throw new Error('two');
		});

		let caught: unknown;
		try {
			a.set(1);
		} catch (error) {
			caught = error;
		}

		expect(caught).toBeInstanceOf(AggregateError);
		expect((caught as AggregateError).errors.map((e) => (e as Error).message)).toEqual(['one', 'two']);
	});

	it('a queued effect stays destroyed', () => {
		const source = signal(0);
		const seen: number[] = [];
		const effect = new SignalEffect(() => seen.push(source()));
		effect.run();

		batch(() => {
			effect.run();
			effect.destroy();
		});
		source.set(1);

		expect(seen).toEqual([0]);
		expect(effect.destroyed).toBe(true);
	});

	it('an effect destroyed by an earlier effect in the same flush does not run', () => {
		const source = signal(0);
		const seen = vi.fn();
		const victim = new SignalEffect(() => {
			source();
			seen();
		});
		// Registered first, so it is queued (and runs) before the victim.
		const killer = new SignalEffect(() => {
			if (source() === 1) {
				victim.destroy();
			}
		});

		killer.run();
		victim.run();
		expect(seen).toHaveBeenCalledTimes(1);

		// Both are queued by this write; killer runs first and destroys victim,
		// whose queued run must then be dropped.
		source.set(1);
		expect(seen).toHaveBeenCalledTimes(1);
		killer.destroy();
	});

	it('computed keeps recomputing after its tracker is reset (destroy is separate from reset)', () => {
		const a = signal(1);
		const doubled = computed(() => a() * 2);
		expect(doubled()).toBe(2);
		a.set(2);
		expect(doubled()).toBe(4);
		a.set(3);
		expect(doubled()).toBe(6);
		doubled.destroy();
		expect(() => doubled()).toThrow(/destroyed|destruction/);
	});
});

describe('signal scheduler: computed subscribers keep source tracking', () => {
	// Regression: the subscriber notification used to be scheduled as the
	// computed's tracking effect. SignalEffect.runNow() clears dependencies
	// before executing, and the execute body only recomputed when dirty — so a
	// read between invalidation and flush (which recomputes and clears dirty)
	// left the scheduled run with nothing to re-track. Every source
	// subscription was dropped and the computed was stale forever.

	it('a read inside batch() does not detach the computed from its sources', () => {
		const a = signal(1);
		const tenfold = computed(() => a() * 10);
		const seen: number[] = [];
		tenfold.subscribe((v) => seen.push(v));
		expect(tenfold()).toBe(10);

		batch(() => {
			a.set(2);
			expect(tenfold()).toBe(20); // fresh read mid-batch clears dirty
		});
		expect(seen).toEqual([20]);

		a.set(3);
		expect(tenfold()).toBe(30);
		expect(seen).toEqual([20, 30]);

		a.set(4);
		expect(seen).toEqual([20, 30, 40]);
	});

	it('an earlier effect reading the computed in the same flush does not detach it', () => {
		const a = signal(1);
		const squared = computed(() => a() * a());
		const subscriberSeen: number[] = [];
		const effectSeen: number[] = [];
		squared.subscribe((v) => subscriberSeen.push(v));

		// This effect is queued alongside the computed's notifier; whichever
		// runs first, the computed must stay tracked afterwards.
		const reader = new SignalEffect(() => {
			effectSeen.push(squared());
		});
		reader.run();
		expect(effectSeen).toEqual([1]);

		a.set(2);
		expect(effectSeen).toEqual([1, 4]);
		expect(subscriberSeen).toEqual([4]);

		a.set(7);
		expect(squared()).toBe(49);
		expect(effectSeen).toEqual([1, 4, 49]);
		expect(subscriberSeen).toEqual([4, 49]);
		reader.destroy();
	});

	it('notifies exactly once when the recompute happened on a read before the flush', () => {
		const a = signal(1);
		const doubled = computed(() => a() * 2);
		const subscriber = vi.fn();
		doubled.subscribe(subscriber);

		batch(() => {
			a.set(5);
			doubled();
			a.set(6);
			doubled();
		});

		expect(subscriber).toHaveBeenCalledTimes(1);
		expect(subscriber).toHaveBeenCalledWith(12);
	});

	it('a subscriber added between invalidation and flush does not swallow the pending notification', () => {
		const a = signal(1);
		const doubled = computed(() => a() * 2);
		const first = vi.fn();
		const second = vi.fn();
		doubled.subscribe(first);

		batch(() => {
			a.set(2);
			doubled.subscribe(second); // recomputes; must not reset the baseline
		});

		expect(first).toHaveBeenCalledWith(4);
		expect(second).toHaveBeenCalledWith(4);
	});

	it('a destroyed computed drops its queued notification', () => {
		const a = signal(1);
		const doubled = computed(() => a() * 2);
		const subscriber = vi.fn();
		doubled.subscribe(subscriber);

		batch(() => {
			a.set(2);
			doubled.destroy();
		});

		expect(subscriber).not.toHaveBeenCalled();
	});
});
