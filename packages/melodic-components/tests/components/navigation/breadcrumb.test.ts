import { describe, it, expect, afterEach } from 'vitest';
import '../../../src/components/navigation/breadcrumb/breadcrumb-item.component';
import { flush, createComponent, removeComponent } from '../../helpers/component-test-utils';

describe('ml-breadcrumb-item separator', () => {
	let el: any;

	afterEach(() => {
		if (el) removeComponent(el);
	});

	it('renders a text slash for separator="slash" (the icon font has no such glyph)', async () => {
		el = createComponent('ml-breadcrumb-item', { properties: { separator: 'slash' } });
		await flush();

		const separator = el.shadowRoot!.querySelector('.ml-breadcrumb-item__separator') as HTMLElement;
		expect(separator.textContent?.trim()).toBe('/');
		expect(separator.querySelector('ml-icon')).toBeNull();
		expect(separator.getAttribute('aria-hidden')).toBe('true');
	});

	it('keeps the caret icon by default', async () => {
		el = createComponent('ml-breadcrumb-item', {});
		await flush();

		const icon = el.shadowRoot!.querySelector('.ml-breadcrumb-item__separator ml-icon') as HTMLElement;
		expect(icon.getAttribute('icon')).toBe('caret-right');
	});
});
