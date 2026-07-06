import { describe, it, expect, afterEach } from 'vitest';
import '../../../src/components/data-display/avatar/avatar.component';
import { flush, createComponent, removeComponent, shadowQuery } from '../../helpers/component-test-utils';

describe('ml-avatar image-error fallback', () => {
	let el: any;

	afterEach(() => {
		if (el) removeComponent(el);
	});

	it('renders the image when src is set', async () => {
		el = createComponent('ml-avatar', { properties: { src: '/broken.jpg', initials: 'JD' } });
		await flush();
		expect(shadowQuery(el, '.ml-avatar__image')).toBeTruthy();
		expect(shadowQuery(el, '.ml-avatar__initials')).toBeNull();
	});

	it('falls back to initials when the image fails to load', async () => {
		el = createComponent('ml-avatar', { properties: { src: '/broken.jpg', initials: 'JD' } });
		await flush();

		const img = shadowQuery<HTMLImageElement>(el, '.ml-avatar__image')!;
		img.dispatchEvent(new Event('error'));
		await flush();

		expect(shadowQuery(el, '.ml-avatar__image')).toBeNull();
		expect(shadowQuery(el, '.ml-avatar__initials')?.textContent).toBe('JD');
	});

	it('falls back to the icon slot when the image fails and no initials exist', async () => {
		el = createComponent('ml-avatar', { properties: { src: '/broken.jpg' } });
		await flush();

		shadowQuery<HTMLImageElement>(el, '.ml-avatar__image')!.dispatchEvent(new Event('error'));
		await flush();

		expect(shadowQuery(el, '.ml-avatar__image')).toBeNull();
		expect(shadowQuery(el, '.ml-avatar__fallback')).toBeTruthy();
	});

	it('retries the image when src changes after an error', async () => {
		el = createComponent('ml-avatar', { properties: { src: '/broken.jpg', initials: 'JD' } });
		await flush();

		shadowQuery<HTMLImageElement>(el, '.ml-avatar__image')!.dispatchEvent(new Event('error'));
		await flush();
		expect(shadowQuery(el, '.ml-avatar__image')).toBeNull();

		el.src = '/fixed.jpg';
		await flush();
		expect(el.imageError).toBe(false);
		const img = shadowQuery<HTMLImageElement>(el, '.ml-avatar__image');
		expect(img).toBeTruthy();
		expect(img?.getAttribute('src')).toBe('/fixed.jpg');
	});
});
