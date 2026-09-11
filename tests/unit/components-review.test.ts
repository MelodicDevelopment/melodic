import { describe, it, expect, afterEach, vi, beforeEach } from 'vitest';
import { mount, flush, query, unmountAll } from '../../src/testing';
import { setDevMode, resetDevWarnings } from '../../src/devtools/dev-mode';

import '../../packages/melodic-components/src/components/forms/button-group/index.js';
import '../../packages/melodic-components/src/components/navigation/tabs/index.js';
import '../../packages/melodic-components/src/components/navigation/steps/index.js';
import '../../packages/melodic-components/src/components/feedback/toast/index.js';
import '../../packages/melodic-components/src/components/navigation/pagination/index.js';
import { matchTabByRoute } from '../../packages/melodic-components/src/components/navigation/functions/match-by-route.function.js';
import { DialogRef } from '../../packages/melodic-components/src/components/overlays/dialog/dialog-ref.class.js';
import { ToastService } from '../../packages/melodic-components/src/components/feedback/toast/toast.service.js';
import { applyTheme, getTheme, toggleTheme } from '../../packages/melodic-components/src/theme/functions/apply-theme.function.js';

afterEach(async () => {
	await unmountAll();
	setDevMode(null);
	resetDevWarnings();
});

/** C1 / C21 / C22 — programmatic state never reached slotted children. */
describe('programmatic state sync', () => {
	it('ml-button-group marks the item matching a programmatic value (C1)', async () => {
		const group = await mount('ml-button-group');
		group.innerHTML = `
			<ml-button-group-item value="list">List</ml-button-group-item>
			<ml-button-group-item value="grid">Grid</ml-button-group-item>
		`;
		await flush();

		(group as unknown as { value: string }).value = 'grid';
		await flush();

		const items = [...group.querySelectorAll('ml-button-group-item')];
		expect(items[0].hasAttribute('active')).toBe(false);
		expect(items[1].hasAttribute('active')).toBe(true);
	});

	it('ml-tabs marks the slotted tab matching a programmatic value (C21)', async () => {
		const tabs = await mount('ml-tabs');
		tabs.innerHTML = `
			<ml-tab slot="tab" value="one" label="One"></ml-tab>
			<ml-tab slot="tab" value="two" label="Two"></ml-tab>
		`;
		await flush();

		(tabs as unknown as { value: string }).value = 'two';
		await flush();

		const slotted = [...tabs.querySelectorAll('ml-tab')];
		expect(slotted[0].hasAttribute('active')).toBe(false);
		expect(slotted[1].hasAttribute('active')).toBe(true);
	});

	it('ml-steps propagates variant and status to slotted steps (C22)', async () => {
		const steps = await mount('ml-steps');
		steps.innerHTML = `
			<ml-step slot="step" value="a" label="A"></ml-step>
			<ml-step slot="step" value="b" label="B"></ml-step>
		`;
		await flush();

		const host = steps as unknown as { active: string; variant: string };
		host.active = 'b';
		host.variant = 'dots';
		await flush();

		const slotted = [...steps.querySelectorAll('ml-step')];
		expect(slotted[0].getAttribute('status')).toBe('completed');
		expect(slotted[1].getAttribute('status')).toBe('current');
		expect(slotted[1].getAttribute('variant')).toBe('dots');
	});

	it('ml-step observes href (C23)', () => {
		const observed = (customElements.get('ml-step') as unknown as { observedAttributes: string[] }).observedAttributes;
		expect(observed).toContain('href');
	});
});

/** C29 — a shorter href used to shadow a longer one. */
describe('route matching for tabs and steps', () => {
	const entries = [
		{ value: 'admin', href: '/admin' },
		{ value: 'users', href: '/admin/users' },
		{ value: 'none', href: undefined }
	];

	it('prefers the longest matching href', () => {
		expect(matchTabByRoute(entries, '/admin/users')?.value).toBe('users');
		expect(matchTabByRoute(entries, '/admin/users/7')?.value).toBe('users');
		expect(matchTabByRoute(entries, '/admin')?.value).toBe('admin');
	});

	it('matches on whole path segments only', () => {
		expect(matchTabByRoute(entries, '/administration')).toBeUndefined();
	});
});

/** C26 — a page beyond the range left nothing marked current. */
describe('ml-pagination', () => {
	it('clamps the active page into the rendered range', async () => {
		const pagination = await mount('ml-pagination', { totalPages: 3, page: 9 });
		await flush();

		const current = query(pagination, '[aria-current="page"]');
		expect(current).not.toBeNull();
		expect(current!.textContent?.trim()).toBe('3');
	});
});

/** C27 — the auto-dismiss timer outlived the element. */
describe('ml-toast', () => {
	it('clears its auto-dismiss timer on destroy', async () => {
		// A short real duration: mocking timers here would also freeze the
		// microtask/macrotask flush the framework's teardown relies on.
		const toast = await mount('ml-toast', { duration: 20 });
		const dismissed = vi.fn();
		toast.addEventListener('ml:dismiss', dismissed);

		toast.remove();
		await flush();

		await new Promise((resolve) => setTimeout(resolve, 60));
		expect(dismissed).not.toHaveBeenCalled();
	});

	it('still auto-dismisses while it is mounted', async () => {
		const toast = await mount('ml-toast', { duration: 20 });
		const dismissed = vi.fn();
		toast.addEventListener('ml:dismiss', dismissed);

		await new Promise((resolve) => setTimeout(resolve, 60));
		expect(dismissed).toHaveBeenCalled();
	});
});

/**
 * C8 — inline dialogs reuse their DialogRef across opens, so callbacks
 * registered per-open pile up. `afterClosed` stays PERSISTENT (one
 * registration fires on every cycle, which ml-dialog's own suite pins); the
 * fix is the unsubscribe function it now returns.
 */
describe('DialogRef callbacks', () => {
	function makeDialog(id: string): { ref: DialogRef; dialogEl: HTMLDialogElement } {
		const dialogEl = document.createElement('dialog');
		document.body.appendChild(dialogEl);
		dialogEl.showModal = () => dialogEl.setAttribute('open', '');
		dialogEl.close = () => {
			dialogEl.removeAttribute('open');
			dialogEl.dispatchEvent(new Event('close'));
		};

		return { ref: new DialogRef(id, dialogEl), dialogEl };
	}

	it('fires one registration on every open/close cycle', () => {
		const { ref, dialogEl } = makeDialog('persistent');
		let calls = 0;
		ref.afterClosed(() => calls++);

		ref.open();
		ref.close();
		ref.open();
		ref.close();

		expect(calls).toBe(2);
		dialogEl.remove();
	});

	it('returns an unsubscribe function, which is how repeat registration is avoided', () => {
		const { ref, dialogEl } = makeDialog('unsubscribe');
		let calls = 0;

		// The accumulating pattern: register before each open. Releasing the
		// previous registration keeps it at one invocation per close instead of
		// 1 + 2 + 3.
		for (let i = 0; i < 3; i++) {
			const stop = ref.afterClosed(() => calls++);
			ref.open();
			ref.close();
			stop();
		}

		expect(calls).toBe(3);
		dialogEl.remove();
	});

	it('warns when callbacks run away on one dialog', () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
		setDevMode(true);

		const { ref, dialogEl } = makeDialog('runaway');
		for (let i = 0; i < 25; i++) {
			ref.afterClosed(() => undefined);
		}

		expect(warn.mock.calls.some((call) => String(call[1]).includes('registered callbacks'))).toBe(true);

		warn.mockRestore();
		dialogEl.remove();
	});
});

/** C37 — no handle, no dismissAll, no cap. */
describe('ToastService', () => {
	beforeEach(() => {
		document.querySelectorAll('ml-toast-container').forEach((element) => element.remove());
	});

	it('returns a handle that dismisses the toast', () => {
		const service = new ToastService();
		const ref = service.info('Saved');

		expect(ref.element.isConnected).toBe(true);
		ref.dismiss();
		expect(ref.element.isConnected).toBe(false);
	});

	it('caps how many toasts are visible and can dismiss them all', () => {
		const service = new ToastService();
		service.setMaxVisible(2);

		const first = service.info('1');
		service.info('2');
		service.info('3');

		expect(first.element.isConnected).toBe(false);
		expect(document.querySelectorAll('ml-toast').length).toBe(2);

		service.dismissAll();
		expect(document.querySelectorAll('ml-toast').length).toBe(0);
	});

	it('uses an assertive role only for errors', () => {
		const service = new ToastService();
		expect(service.success('ok').element.getAttribute('role')).toBe('status');
		expect(service.error('bad').element.getAttribute('role')).toBe('alert');
		service.dismissAll();
	});
});

/** C25 — toggleTheme was a no-op after an inline anti-FOUC script. */
describe('toggleTheme', () => {
	afterEach(() => {
		document.documentElement.removeAttribute('data-theme');
	});

	it('adopts a data-theme set before the module was used', () => {
		document.documentElement.setAttribute('data-theme', 'dark');
		expect(getTheme()).toBe('dark');

		toggleTheme();
		expect(document.documentElement.getAttribute('data-theme')).toBe('light');
	});

	it('still follows applyTheme afterwards', () => {
		applyTheme('dark');
		expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
		toggleTheme();
		expect(document.documentElement.getAttribute('data-theme')).toBe('light');
	});
});
