import { describe, it, expect } from 'vitest';
import { signal, computed, batch, SignalEffect } from '../../src/signals';

describe('signal equality (Object.is)', () => {
	it('does not notify when set to an equal NaN', () => {
		const s = signal(NaN);
		let notifications = 0;
		s.subscribe(() => notifications++);

		s.set(NaN);
		expect(notifications).toBe(0);
	});

	it('notifies when crossing between -0 and +0', () => {
		const s = signal(-0);
		let notifications = 0;
		s.subscribe(() => notifications++);

		s.set(0); // Object.is(-0, 0) === false
		expect(notifications).toBe(1);
	});

	it('still de-dupes equal primitive values', () => {
		const s = signal(5);
		let notifications = 0;
		s.subscribe(() => notifications++);

		s.set(5);
		expect(notifications).toBe(0);
		s.set(6);
		expect(notifications).toBe(1);
	});
});

describe('batch', () => {
	it('coalesces multiple writes into a single notification per signal', () => {
		const a = signal(0);
		let notifications = 0;
		a.subscribe(() => notifications++);

		batch(() => {
			a.set(1);
			a.set(2);
			a.set(3);
		});

		expect(notifications).toBe(1);
		expect(a()).toBe(3);
	});

	it('defers a computed recomputation until the batch flushes', () => {
		const first = signal(1);
		const second = signal(1);
		let computations = 0;
		const sum = computed(() => {
			computations++;
			return first() + second();
		});

		expect(sum()).toBe(2);
		const baseline = computations;

		batch(() => {
			first.set(10);
			second.set(20);
		});

		expect(sum()).toBe(30);
		// Diamond update: a single coalesced recompute, not one per source write.
		expect(computations).toBe(baseline + 1);
	});

	it('flushes only at the outermost batch (nested batches)', () => {
		const a = signal(0);
		let notifications = 0;
		a.subscribe(() => notifications++);

		batch(() => {
			a.set(1);
			batch(() => {
				a.set(2);
			});
			expect(notifications).toBe(0); // still deferred
		});

		expect(notifications).toBe(1);
		expect(a()).toBe(2);
	});

	it('returns the callback result', () => {
		expect(batch(() => 42)).toBe(42);
	});
});

describe('SignalEffect circular-dependency guard', () => {
	it('throws instead of hanging when an effect writes a signal it reads', () => {
		const s = signal(0);
		const effect = new SignalEffect(() => {
			// Read then unconditionally write a new value → self-perpetuating loop.
			s.set(s()! + 1);
		});

		expect(() => effect.run()).toThrow(/circular dependency/i);
	});

	it('does not trip for a normal effect that runs once', () => {
		const s = signal(1);
		let runs = 0;
		const effect = new SignalEffect(() => {
			s();
			runs++;
		});

		expect(() => effect.run()).not.toThrow();
		expect(runs).toBe(1);
	});
});
