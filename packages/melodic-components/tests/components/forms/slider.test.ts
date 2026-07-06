import { describe, it, expect, afterEach } from 'vitest';
import '../../../src/components/forms/slider/slider.component';
import { flush, createComponent, removeComponent } from '../../helpers/component-test-utils';

describe('ml-slider', () => {
	let el: any;

	afterEach(() => {
		if (el) removeComponent(el);
	});

	describe('fill geometry', () => {
		// Note: assertions target the component getter because happy-dom's CSS
		// parser rejects any calc() containing var() (browsers accept it), so the
		// bound inline style is not observable in this environment.
		it('derives the fill offset from the thumb-size token instead of hardcoded pixels', async () => {
			el = createComponent('ml-slider', { attributes: { value: '25', min: '0', max: '100' } });
			await flush();

			const width = el.component.fillWidth as string;
			expect(width).toContain('var(--ml-slider-thumb-size)');
			expect(width).toContain('25%');
			expect(width).not.toMatch(/\dpx/);
		});

		it('has zero token offset at the midpoint and half-thumb offset at the ends', async () => {
			el = createComponent('ml-slider', { attributes: { value: '50', min: '0', max: '100' } });
			await flush();
			expect(el.component.fillWidth).toBe('calc(50% + 0 * var(--ml-slider-thumb-size))');

			el.value = 0;
			await flush();
			expect(el.component.fillWidth).toBe('calc(0% + 0.5 * var(--ml-slider-thumb-size))');

			el.value = 100;
			await flush();
			expect(el.component.fillWidth).toBe('calc(100% + -0.5 * var(--ml-slider-thumb-size))');
		});
	});
});
