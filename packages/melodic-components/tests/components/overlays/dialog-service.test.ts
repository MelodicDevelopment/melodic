import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from 'vitest';
import { Injector } from '@melodicdev/core';
import { DialogService } from '../../../src/components/overlays/dialog/dialog.service';
// Importing the component registers the <ml-dialog> custom element.
import '../../../src/components/overlays/dialog/dialog.component';
import { createComponent, flush } from '../../helpers/component-test-utils';

/**
 * happy-dom doesn't implement the HTMLDialogElement modal API; stub the bits
 * DialogRef.open()/close() touch so the service can run end to end.
 */
function stubDialogModalApi(el: HTMLDialogElement): void {
	if (typeof el.showModal !== 'function') (el as any).showModal = vi.fn();
	if (typeof el.close !== 'function') (el as any).close = vi.fn();
}

describe('DialogService registration identity', () => {
	let service: DialogService;
	const created: HTMLDialogElement[] = [];

	beforeEach(() => {
		service = new DialogService();
	});

	afterEach(() => {
		created.splice(0).forEach((el) => el.remove());
	});

	function makeDialogEl(id: string): HTMLDialogElement {
		const el = document.createElement('dialog') as HTMLDialogElement;
		el.id = id;
		stubDialogModalApi(el);
		vi.spyOn(el, 'showModal');
		document.body.appendChild(el);
		created.push(el);
		return el;
	}

	it("a stale element's removeDialog does not wipe a newer registration (re-render)", () => {
		const oldEl = makeDialogEl('x');
		service.addDialog('x', oldEl);

		// Re-render: the new instance registers (same id) BEFORE the old one tears down.
		const newEl = makeDialogEl('x');
		service.addDialog('x', newEl);

		// The stale old element's late onDestroy must not delete the new registration.
		service.removeDialog('x', oldEl);

		const dialogs = (service as unknown as { _dialogs: Map<string, { dialogEl: HTMLDialogElement }> })._dialogs;
		expect(dialogs.size).toBe(1);
		expect(dialogs.get('x')?.dialogEl).toBe(newEl);

		expect(() => service.open('x')).not.toThrow();
		expect(newEl.showModal).toHaveBeenCalledTimes(1);
		expect(oldEl.showModal).not.toHaveBeenCalled();
	});

	it('removeDialog with the owning element removes the entry (real teardown)', () => {
		const el = makeDialogEl('x');
		service.addDialog('x', el);

		service.removeDialog('x', el);

		const dialogs = (service as unknown as { _dialogs: Map<string, unknown> })._dialogs;
		expect(dialogs.has('x')).toBe(false);
	});

	it('removeDialog ignores a non-matching element', () => {
		const el = makeDialogEl('x');
		const other = makeDialogEl('x');
		service.addDialog('x', el);

		service.removeDialog('x', other);

		const dialogs = (service as unknown as { _dialogs: Map<string, unknown> })._dialogs;
		expect(dialogs.has('x')).toBe(true);
	});

	it('removeDialog without an element deletes unconditionally (programmatic cleanup path)', () => {
		const el = makeDialogEl('x');
		service.addDialog('x', el);

		service.removeDialog('x');

		const dialogs = (service as unknown as { _dialogs: Map<string, unknown> })._dialogs;
		expect(dialogs.has('x')).toBe(false);
	});
});

describe('DialogService robustness', () => {
	let service: DialogService;
	const created: HTMLDialogElement[] = [];

	beforeEach(() => {
		service = new DialogService();
	});

	afterEach(() => {
		created.splice(0).forEach((el) => el.remove());
		vi.restoreAllMocks();
	});

	function makeDialogEl(id: string): HTMLDialogElement {
		const el = document.createElement('dialog') as HTMLDialogElement;
		el.id = id;
		stubDialogModalApi(el);
		document.body.appendChild(el);
		created.push(el);
		return el;
	}

	it('open() with an unregistered id warns and returns undefined instead of throwing', () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

		let result: unknown = 'sentinel';
		expect(() => {
			result = service.open('nope' as any);
		}).not.toThrow();

		expect(result).toBeUndefined();
		expect(warn).toHaveBeenCalledTimes(1);
		expect(String(warn.mock.calls[0][0])).toContain('nope');
	});

	it('close() with an unregistered id warns and does not throw', () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

		expect(() => service.close('missing' as any)).not.toThrow();
		expect(warn).toHaveBeenCalledTimes(1);
	});

	it('re-registering the same id removes the previous element close listener (no accumulation)', () => {
		const oldEl = makeDialogEl('x');
		const removeSpy = vi.spyOn(oldEl, 'removeEventListener');
		service.addDialog('x' as any, oldEl);

		const newEl = makeDialogEl('x');
		service.addDialog('x' as any, newEl);

		const closeRemovals = removeSpy.mock.calls.filter(([type]) => type === 'close');
		expect(closeRemovals.length).toBe(1);
	});

	it('removeDialog removes the service close listener from the element', () => {
		const el = makeDialogEl('x');
		const addSpy = vi.spyOn(el, 'addEventListener');
		const removeSpy = vi.spyOn(el, 'removeEventListener');
		service.addDialog('x' as any, el);

		const addedCloseListeners = addSpy.mock.calls.filter(([type]) => type === 'close').map(([, listener]) => listener);
		service.removeDialog('x' as any);

		const removedCloseListeners = removeSpy.mock.calls.filter(([type]) => type === 'close').map(([, listener]) => listener);
		// The service-registered close listener must be among the removed ones.
		expect(addedCloseListeners.some((l) => removedCloseListeners.includes(l))).toBe(true);
	});
});

describe('inline <ml-dialog> survives a re-render that recreates it', () => {
	let service: DialogService;
	const hosts: HTMLElement[] = [];

	beforeAll(() => {
		// open() walks into the inner <dialog> created by the framework, so stub
		// the modal API on the prototype before any are mounted.
		if (typeof HTMLDialogElement.prototype.showModal !== 'function') {
			(HTMLDialogElement.prototype as any).showModal = function (): void {
				(this as HTMLDialogElement & { open: boolean }).open = true;
			};
		}
		if (typeof HTMLDialogElement.prototype.close !== 'function') {
			(HTMLDialogElement.prototype as any).close = function (): void {
				(this as HTMLDialogElement & { open: boolean }).open = false;
				this.dispatchEvent(new Event('close'));
			};
		}
	});

	beforeEach(() => {
		service = Injector.get(DialogService);
		(service as unknown as { _dialogs: Map<string, unknown> })._dialogs.clear();
	});

	afterEach(() => {
		hosts.splice(0).forEach((el) => el.remove());
		(service as unknown as { _dialogs: Map<string, unknown> })._dialogs.clear();
	});

	function mountInlineDialog(): HTMLElement {
		const host = createComponent('ml-dialog', { attributes: { '#x': '' } });
		hosts.push(host);
		return host;
	}

	it('open(id) opens (no throw) and keeps exactly one entry on the live element', async () => {
		const oldHost = mountInlineDialog();
		await flush();

		// Parent re-renders and recreates the inline dialog: new connects first.
		const newHost = mountInlineDialog();
		await flush();

		// The old element is torn down afterwards (onDestroy fires on a microtask).
		oldHost.remove();
		await flush();

		const dialogs = (service as unknown as { _dialogs: Map<string, { dialogEl: HTMLDialogElement }> })._dialogs;
		expect(dialogs.size).toBe(1);

		const liveInner = newHost.shadowRoot?.querySelector('dialog') as HTMLDialogElement;
		expect(dialogs.get('x')?.dialogEl).toBe(liveInner);

		expect(() => service.open('x')).not.toThrow();
	});

	it('destroying the real (last) instance removes the entry', async () => {
		const host = mountInlineDialog();
		await flush();

		const dialogs = (service as unknown as { _dialogs: Map<string, unknown> })._dialogs;
		expect(dialogs.has('x')).toBe(true);

		host.remove();
		await flush();

		expect(dialogs.has('x')).toBe(false);
	});
});
