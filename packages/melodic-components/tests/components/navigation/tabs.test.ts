import { describe, it, expect, afterEach } from 'vitest';
import '../../../src/components/navigation/tabs/tabs.component';
import '../../../src/components/navigation/tabs/tab.component';
import '../../../src/components/navigation/tabs/tab-panel.component';
import { flush, createComponent, removeComponent, captureEvent } from '../../helpers/component-test-utils';

const configTabs = [
	{ value: 'a', label: 'Alpha' },
	{ value: 'b', label: 'Beta' },
	{ value: 'c', label: 'Gamma' }
];

async function settle(): Promise<void> {
	await flush();
	await new Promise((r) => setTimeout(r, 0));
	await flush();
}

describe('ml-tabs config mode — stable repeat keys', () => {
	let el: any;

	afterEach(() => {
		if (el) removeComponent(el);
	});

	it('reuses the same tab buttons across a selection change', async () => {
		el = createComponent('ml-tabs', { properties: { tabs: configTabs, value: 'a' } });
		await settle();

		const before = Array.from(el.shadowRoot!.querySelectorAll('[role="tab"]'));
		expect(before).toHaveLength(3);

		el.value = 'b';
		await settle();

		const after = Array.from(el.shadowRoot!.querySelectorAll('[role="tab"]'));
		expect(after).toHaveLength(3);
		for (let i = 0; i < 3; i++) {
			expect(after[i]).toBe(before[i]); // identical nodes — not recreated
		}
		expect((after[1] as HTMLElement).getAttribute('aria-selected')).toBe('true');
		expect((after[0] as HTMLElement).getAttribute('aria-selected')).toBe('false');
	});

	it('keeps focus on the just-activated button through the async re-render', async () => {
		el = createComponent('ml-tabs', { properties: { tabs: configTabs, value: 'a' } });
		await settle();

		const buttonA = el.shadowRoot!.querySelector('[data-value="a"]') as HTMLElement;
		buttonA.focus();

		// Arrow to the next tab from the tablist keydown handler.
		buttonA.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, composed: true }));
		await settle();

		const buttonB = el.shadowRoot!.querySelector('[data-value="b"]') as HTMLElement;
		expect(el.value).toBe('b');
		expect(el.shadowRoot!.activeElement).toBe(buttonB);
		expect(buttonB.isConnected).toBe(true);
	});
});

describe('ml-tabs slotted mode — keyboard focus', () => {
	let el: HTMLElement;

	afterEach(() => {
		if (el) removeComponent(el);
	});

	function buildSlottedTabs(): HTMLElement {
		const tabs = document.createElement('ml-tabs');
		tabs.innerHTML = `
			<ml-tab slot="tab" value="one" label="First"></ml-tab>
			<ml-tab slot="tab" value="two" label="Second"></ml-tab>
			<ml-tab-panel value="one">Panel one</ml-tab-panel>
			<ml-tab-panel value="two">Panel two</ml-tab-panel>
		`;
		document.body.appendChild(tabs);
		return tabs;
	}

	it('moves focus into the next slotted tab on ArrowRight', async () => {
		el = buildSlottedTabs();
		await settle();

		const [hostOne, hostTwo] = Array.from(el.querySelectorAll('ml-tab'));
		const buttonOne = hostOne.shadowRoot!.querySelector('.ml-tab') as HTMLElement;
		const buttonTwo = hostTwo.shadowRoot!.querySelector('.ml-tab') as HTMLElement;
		expect(buttonOne).toBeTruthy();

		buttonOne.focus();
		// In a real browser the keydown bubbles from the slotted tab through the
		// slot into the tablist; happy-dom doesn't propagate across slots, so
		// dispatch on the tablist (the handler under test) directly.
		const tablist = el.shadowRoot!.querySelector('.ml-tabs__list') as HTMLElement;
		tablist.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, composed: true }));
		await settle();

		expect((el as any).value).toBe('two');
		expect(hostTwo.shadowRoot!.activeElement).toBe(buttonTwo);
	});

	it('shows only the active panel and names panels after their tabs', async () => {
		el = buildSlottedTabs();
		await settle();

		const [panelOne, panelTwo] = Array.from(el.querySelectorAll('ml-tab-panel')) as HTMLElement[];
		expect(panelOne.style.display).toBe('');
		expect(panelTwo.style.display).toBe('none');

		const innerOne = panelOne.shadowRoot!.querySelector('[role="tabpanel"]');
		const innerTwo = panelTwo.shadowRoot!.querySelector('[role="tabpanel"]');
		expect(innerOne?.getAttribute('aria-label')).toBe('First');
		expect(innerTwo?.getAttribute('aria-label')).toBe('Second');
	});

	it('emits ml:change when activating a tab', async () => {
		el = buildSlottedTabs();
		await settle();

		const eventPromise = captureEvent<{ value: string }>(el, 'ml:change');
		const hostTwo = el.querySelectorAll('ml-tab')[1];
		(hostTwo.shadowRoot!.querySelector('.ml-tab') as HTMLElement).click();
		const event = await eventPromise;
		expect(event.detail.value).toBe('two');
	});
});
