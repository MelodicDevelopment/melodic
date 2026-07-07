import { describe, it, expect } from 'vitest';
import { signal } from '../../src/signals/functions/signal.function';
import { SignalEffect } from '../../src/signals/classes/signal-effect.class';
import { getActiveEffect } from '../../src/signals/functions/active-effect.functions';

describe('SignalEffect exception safety', () => {
	it('restores the active effect when execute() throws', () => {
		const source = signal(0);

		const effect = new SignalEffect(() => {
			source();
			throw new Error('boom');
		});

		expect(() => effect.run()).toThrow('boom');

		// The global tracking pointer must NOT be left pointing at the dead effect.
		expect(getActiveEffect()).toBeNull();
	});

	it('does not attribute later signal reads to a dead throwing effect', () => {
		const source = signal(0);
		let runs = 0;

		const effect = new SignalEffect(() => {
			runs++;
			source();
			throw new Error('boom');
		});

		expect(() => effect.run()).toThrow('boom');
		expect(runs).toBe(1);

		// If activeEffect leaked, this untracked read would subscribe the dead
		// effect to `other`, and the set() below would re-run it.
		const other = signal(10);
		other();
		other.set(11);

		expect(runs).toBe(1);
	});

	it('resets _isRunning so the effect can run again after a throw', () => {
		const source = signal(0);
		let runs = 0;

		const effect = new SignalEffect(() => {
			runs++;
			if (source() === 1) {
				throw new Error('boom');
			}
		});

		effect.run();
		expect(runs).toBe(1);

		// The dependency registered before the throw triggers a re-run that throws.
		expect(() => source.set(1)).toThrow('boom');
		expect(runs).toBe(2);

		// With _isRunning stuck true (the old bug), this would only mark
		// _needsRerun and never execute again.
		source.set(2);
		expect(runs).toBe(3);
	});

	it('nested effect tracking survives an inner throw', () => {
		const inner = signal(0);
		const outer = signal(0);
		let outerRuns = 0;

		const throwingEffect = new SignalEffect(() => {
			inner();
			throw new Error('inner boom');
		});

		const outerEffect = new SignalEffect(() => {
			outerRuns++;
			try {
				throwingEffect.runNow();
			} catch {
				// swallow — outer effect keeps going
			}
			// Read AFTER the inner throw: this dependency only registers to the
			// outer effect if the inner run restored the active-effect pointer.
			outer();
		});

		outerEffect.run();
		expect(outerRuns).toBe(1);

		// With the leak, `outer` would have subscribed the dead inner effect
		// instead — set() would throw and the outer effect would never re-run.
		expect(() => outer.set(1)).not.toThrow();
		expect(outerRuns).toBe(2);
	});
});
