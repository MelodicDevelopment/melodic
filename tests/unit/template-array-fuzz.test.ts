import { describe, it, expect, vi, afterEach } from 'vitest';
import { runArrayFuzz, type Mode } from '../helpers/array-fuzz';

/**
 * Randomised list rendering — see tests/helpers/array-fuzz.ts for what is
 * checked after every step. Seeds are fixed so a failure is reproducible; the
 * failure message carries the seed and the operation log.
 */
describe('array rendering fuzz', () => {
	const SEEDS = 200;
	const STEPS = 40;

	// Reorders legitimately trigger the unkeyed-churn advisory; it is not what
	// this suite is checking.
	const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
	afterEach(() => warn.mockClear());

	for (const mode of ['keyed', 'unkeyed', 'repeat'] as Mode[]) {
		it(`${mode}: ${SEEDS} seeds x ${STEPS} steps keep DOM, layout and disposal consistent`, () => {
			const failures: string[] = [];
			for (let seed = 1; seed <= SEEDS; seed++) {
				const container = document.createElement('div');
				document.body.appendChild(container);
				try {
					failures.push(...runArrayFuzz(mode, seed, STEPS, container, { layout: !process.env.FUZZ_NO_LAYOUT }).failures);
				} finally {
					container.remove();
				}
				if (failures.length > 0) break;
			}
			expect(failures.join('\n\n')).toBe('');
		});
	}
});
