import { describe, it, expect, afterEach } from 'vitest';
import '../../../src/components/feedback/progress/progress.component';
import { flush, createComponent, removeComponent, shadowQuery } from '../../helpers/component-test-utils';

describe('ml-progress accessibility', () => {
	let el: any;

	afterEach(() => {
		if (el) removeComponent(el);
		el = null;
	});

	const shapes = [
		{ shape: 'linear', selector: '.ml-progress__track' },
		{ shape: 'circle', selector: '.ml-progress-circle' },
		{ shape: 'half-circle', selector: '.ml-progress-half' }
	] as const;

	it.each(shapes)('exposes role="progressbar" with aria values for the $shape shape', async ({ shape, selector }) => {
		el = createComponent('ml-progress', { attributes: { shape, value: '60', max: '100' } });
		await flush();

		const bar = shadowQuery(el, selector);
		expect(bar).toBeTruthy();
		expect(bar!.getAttribute('role')).toBe('progressbar');
		expect(bar!.getAttribute('aria-valuemin')).toBe('0');
		expect(bar!.getAttribute('aria-valuemax')).toBe('100');
		expect(bar!.getAttribute('aria-valuenow')).toBe('60');
		expect(bar!.getAttribute('aria-label')).toBe('Progress');
	});

	it.each(shapes)('uses the provided label as accessible name for the $shape shape', async ({ shape, selector }) => {
		el = createComponent('ml-progress', { attributes: { shape, value: '30', label: 'Upload' } });
		await flush();
		expect(shadowQuery(el, selector)!.getAttribute('aria-label')).toBe('Upload');
	});

	it.each(shapes)('clamps aria-valuenow to aria-valuemax for the $shape shape', async ({ shape, selector }) => {
		el = createComponent('ml-progress', { attributes: { shape, value: '150', max: '100' } });
		await flush();
		const bar = shadowQuery(el, selector)!;
		expect(bar.getAttribute('aria-valuenow')).toBe('100');
		expect(bar.getAttribute('aria-valuemax')).toBe('100');
	});

	it.each(shapes)('clamps negative values to 0 for the $shape shape', async ({ shape, selector }) => {
		el = createComponent('ml-progress', { attributes: { shape, value: '-25' } });
		await flush();
		expect(shadowQuery(el, selector)!.getAttribute('aria-valuenow')).toBe('0');
	});

	it('clamps against a custom max', async () => {
		el = createComponent('ml-progress', { attributes: { value: '500', max: '200' } });
		await flush();
		const bar = shadowQuery(el, '.ml-progress__track')!;
		expect(bar.getAttribute('aria-valuenow')).toBe('200');
		expect(bar.getAttribute('aria-valuemax')).toBe('200');
	});

	it('keeps in-range values untouched', async () => {
		el = createComponent('ml-progress', { attributes: { value: '42' } });
		await flush();
		expect(shadowQuery(el, '.ml-progress__track')!.getAttribute('aria-valuenow')).toBe('42');
	});
});
