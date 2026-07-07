import { describe, it, expect, afterEach } from 'vitest';
import '../../../src/components/navigation/tabs/tabs.component';
import '../../../src/components/navigation/steps/steps.component';
import '../../../src/components/navigation/sidebar/sidebar.component';
import { flush, createComponent, removeComponent } from '../../helpers/component-test-utils';

/**
 * Internal child→parent coordination events must not escape the consuming
 * parent: the parent stopPropagation()s them and re-emits its public event
 * (ml:change / ml:item-click). These tests dispatch the coordination event
 * from a light-DOM child and assert it never reaches the document while the
 * public event does.
 */

async function settle(): Promise<void> {
	await flush();
	await new Promise((r) => setTimeout(r, 0));
	await flush();
}

function dispatchFromChild(host: HTMLElement, eventName: string, detail: unknown): void {
	const child = document.createElement('div');
	host.appendChild(child);
	child.dispatchEvent(new CustomEvent(eventName, { bubbles: true, composed: true, detail }));
}

describe('internal coordination events are stopped at the consumer', () => {
	let el: any;
	const documentListeners: Array<{ type: string; fn: EventListener }> = [];

	function listenOnDocument(type: string): { count: number } {
		const state = { count: 0 };
		const fn = (): void => {
			state.count++;
		};
		document.addEventListener(type, fn);
		documentListeners.push({ type, fn });
		return state;
	}

	afterEach(() => {
		if (el) removeComponent(el);
		el = null;
		for (const { type, fn } of documentListeners) {
			document.removeEventListener(type, fn);
		}
		documentListeners.length = 0;
	});

	it('ml-tabs: ml:tab-click does not escape; ml:change does', async () => {
		el = createComponent('ml-tabs', {
			properties: { tabs: [{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }], value: 'a' }
		});
		await settle();

		const leaked = listenOnDocument('ml:tab-click');
		const changed = listenOnDocument('ml:change');

		dispatchFromChild(el, 'ml:tab-click', { value: 'b', href: undefined });
		await settle();

		expect(leaked.count).toBe(0);
		expect(changed.count).toBe(1);
		expect(el.value).toBe('b');
	});

	it('ml-steps: ml:step-click does not escape; ml:change does', async () => {
		el = createComponent('ml-steps', {
			properties: { steps: [{ value: 's1', label: 'One' }, { value: 's2', label: 'Two' }], active: 's1' }
		});
		await settle();

		const leaked = listenOnDocument('ml:step-click');
		const changed = listenOnDocument('ml:change');

		dispatchFromChild(el, 'ml:step-click', { value: 's2', href: undefined });
		await settle();

		expect(leaked.count).toBe(0);
		expect(changed.count).toBe(1);
		expect(el.active).toBe('s2');
	});

	it('ml-sidebar: ml:sidebar-item-click does not escape; ml:change and ml:item-click do', async () => {
		el = createComponent('ml-sidebar');
		await settle();

		const leaked = listenOnDocument('ml:sidebar-item-click');
		const changed = listenOnDocument('ml:change');
		const itemClicked = listenOnDocument('ml:item-click');

		dispatchFromChild(el, 'ml:sidebar-item-click', { value: 'home', href: '/home' });
		await settle();

		expect(leaked.count).toBe(0);
		expect(changed.count).toBe(1);
		expect(itemClicked.count).toBe(1);
		expect(el.active).toBe('home');
	});
});
