import { describe, it, expect, afterEach } from 'vitest';
import '../../../src/components/foundation/divider/divider.component';
import {
	flush,
	createComponent,
	removeComponent,
	shadowQuery,
	shadowHasClass
} from '../../helpers/component-test-utils';

/** Wait for slotchange (fires on a task) plus one render microtask. */
async function settle(): Promise<void> {
	await new Promise((resolve) => setTimeout(resolve, 20));
	await flush();
}

describe('ml-divider', () => {
	let el: any;

	afterEach(() => {
		if (el) removeComponent(el);
		el = null;
	});

	it('renders a horizontal separator by default', () => {
		el = createComponent('ml-divider');
		const div = shadowQuery(el, '.ml-divider');
		expect(div).toBeTruthy();
		expect(div!.classList.contains('ml-divider--horizontal')).toBe(true);
		expect(div!.getAttribute('role')).toBe('separator');
		expect(div!.getAttribute('aria-orientation')).toBe('horizontal');
	});

	it('renders vertical orientation', async () => {
		el = createComponent('ml-divider', { attributes: { orientation: 'vertical' } });
		await flush();
		expect(shadowHasClass(el, '.ml-divider', 'ml-divider--vertical')).toBe(true);
		expect(shadowQuery(el, '.ml-divider')!.getAttribute('aria-orientation')).toBe('vertical');
	});

	it('has no label class without content', async () => {
		el = createComponent('ml-divider');
		await settle();
		expect(el.hasLabel).toBe(false);
		expect(shadowHasClass(el, '.ml-divider', 'ml-divider--with-label')).toBe(false);
	});

	it('always renders the label slot for projection', () => {
		el = createComponent('ml-divider');
		expect(shadowQuery(el, '.ml-divider__label slot')).toBeTruthy();
	});

	it('applies the label class when created with label content', async () => {
		el = document.createElement('ml-divider');
		el.textContent = 'OR';
		document.body.appendChild(el);
		await settle();
		expect(el.hasLabel).toBe(true);
		expect(shadowHasClass(el, '.ml-divider', 'ml-divider--with-label')).toBe(true);
	});

	it('reacts to label content added after mount', async () => {
		el = createComponent('ml-divider');
		await settle();
		expect(el.hasLabel).toBe(false);

		el.appendChild(document.createTextNode('OR'));
		await settle();

		expect(el.hasLabel).toBe(true);
		expect(shadowHasClass(el, '.ml-divider', 'ml-divider--with-label')).toBe(true);
	});

	it('reacts to label content removed after mount', async () => {
		el = document.createElement('ml-divider');
		el.textContent = 'OR';
		document.body.appendChild(el);
		await settle();
		expect(el.hasLabel).toBe(true);

		el.textContent = '';
		await settle();

		expect(el.hasLabel).toBe(false);
		expect(shadowHasClass(el, '.ml-divider', 'ml-divider--with-label')).toBe(false);
	});

	it('ignores whitespace-only text nodes', async () => {
		el = document.createElement('ml-divider');
		el.textContent = '   ';
		document.body.appendChild(el);
		await settle();
		expect(el.hasLabel).toBe(false);
	});
});
