import { describe, it, expect, afterEach } from 'vitest';
import '../../../src/components/feedback/alert/alert.component';
// Register ml-icon since alert renders default icons
import '../../../src/components/general/icon/icon.component';
import {
	flush,
	createComponent,
	removeComponent,
	shadowQuery,
	shadowHasClass,
	captureEvent
} from '../../helpers/component-test-utils';

describe('ml-alert', () => {
	let el: any;

	afterEach(() => {
		if (el) removeComponent(el);
	});

	it('renders with role="alert"', () => {
		el = createComponent('ml-alert');
		const alertDiv = shadowQuery(el, '.ml-alert');
		expect(alertDiv).toBeTruthy();
		expect(alertDiv!.getAttribute('role')).toBe('alert');
	});

	it('applies variant class', async () => {
		el = createComponent('ml-alert', { properties: { variant: 'success' } });
		await flush();
		expect(shadowHasClass(el, '.ml-alert', 'ml-alert--success')).toBe(true);
	});

	it('defaults to info variant', () => {
		el = createComponent('ml-alert');
		expect(shadowHasClass(el, '.ml-alert', 'ml-alert--info')).toBe(true);
	});

	it('renders title when set', async () => {
		el = createComponent('ml-alert', { properties: { title: 'Warning!' } });
		await flush();
		const title = shadowQuery(el, '.ml-alert__title');
		expect(title).toBeTruthy();
		expect(title!.textContent).toContain('Warning!');
	});

	it('does not render title when empty', () => {
		el = createComponent('ml-alert');
		expect(shadowQuery(el, '.ml-alert__title')).toBeFalsy();
	});

	it('renders dismiss button when dismissible', async () => {
		el = createComponent('ml-alert', { properties: { dismissible: true } });
		await flush();
		const btn = shadowQuery(el, '.ml-alert__dismiss');
		expect(btn).toBeTruthy();
	});

	it('does not render dismiss button by default', () => {
		el = createComponent('ml-alert');
		expect(shadowQuery(el, '.ml-alert__dismiss')).toBeFalsy();
	});

	it('emits ml:dismiss event on dismiss', async () => {
		el = createComponent('ml-alert', { properties: { dismissible: true } });
		await flush();
		const eventPromise = captureEvent(el, 'ml:dismiss');
		const btn = shadowQuery<HTMLButtonElement>(el, '.ml-alert__dismiss')!;
		btn.click();
		await eventPromise;
	});

	it('sets hidden attribute on dismiss', async () => {
		el = createComponent('ml-alert', { properties: { dismissible: true } });
		await flush();
		expect(el.hasAttribute('hidden')).toBe(false);
		const btn = shadowQuery<HTMLButtonElement>(el, '.ml-alert__dismiss')!;
		btn.click();
		expect(el.hasAttribute('hidden')).toBe(true);
	});

	it('renders all variant types', async () => {
		const variants = ['info', 'success', 'warning', 'error'] as const;
		for (const variant of variants) {
			const alertEl = createComponent('ml-alert', { properties: { variant } });
			await flush();
			expect(shadowHasClass(alertEl, '.ml-alert', `ml-alert--${variant}`)).toBe(true);
			removeComponent(alertEl);
		}
		// Prevent afterEach double-remove
		el = null;
	});
});
