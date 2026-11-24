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
			expect(width).toContain('var(--ml-slider-thumb-size, 20px)');
			expect(width).toContain('25%');
			// The only pixel value is the token's fallback. Without one the whole
			// calc() is invalid whenever the token is unset, and the fill has no
			// width at all — which is what 4.0.1 shipped.
			expect(width.replace('var(--ml-slider-thumb-size, 20px)', '')).not.toMatch(/\dpx/);
		});

		it('has zero token offset at the midpoint and half-thumb offset at the ends', async () => {
			el = createComponent('ml-slider', { attributes: { value: '50', min: '0', max: '100' } });
			await flush();
			expect(el.component.fillWidth).toBe('calc(50% + 0 * var(--ml-slider-thumb-size, 20px))');

			el.value = 0;
			await flush();
			expect(el.component.fillWidth).toBe('calc(0% + 0.5 * var(--ml-slider-thumb-size, 20px))');

			el.value = 100;
			await flush();
			expect(el.component.fillWidth).toBe('calc(100% + -0.5 * var(--ml-slider-thumb-size, 20px))');
		});
	});
});

describe('ml-slider binding order', () => {
	let el: any;

	afterEach(() => {
		if (el) removeComponent(el);
	});

	// A range input clamps a value against the range in force when it is
	// assigned, so `min`/`max`/`step` must be applied before `.value`.
	// happy-dom does not clamp, so assert the order the attributes land in.
	it('applies min / max / step before the value', async () => {
		const assigned: string[] = [];
		const proto = HTMLInputElement.prototype;
		const valueDescriptor = Object.getOwnPropertyDescriptor(proto, 'value')!;
		const originalSetAttribute = proto.setAttribute;

		Object.defineProperty(proto, 'value', {
			configurable: true,
			get: valueDescriptor.get,
			set(this: HTMLInputElement, v: string) {
				if (this.type === 'range') assigned.push('value');
				valueDescriptor.set!.call(this, v);
			}
		});
		proto.setAttribute = function (this: HTMLInputElement, name: string, v: string): void {
			if (this.type === 'range' && (name === 'min' || name === 'max' || name === 'step')) assigned.push(name);
			originalSetAttribute.call(this, name, v);
		};

		try {
			el = createComponent('ml-slider', { attributes: { value: '500', min: '0', max: '1000', step: '10' } });
			await flush();
		} finally {
			Object.defineProperty(proto, 'value', valueDescriptor);
			proto.setAttribute = originalSetAttribute;
		}

		const firstValue = assigned.indexOf('value');
		expect(firstValue).toBeGreaterThan(-1);
		for (const name of ['min', 'max', 'step']) {
			expect(assigned.indexOf(name)).toBeGreaterThan(-1);
			expect(assigned.indexOf(name)).toBeLessThan(firstValue);
		}
	});
});
