import { describe, it, expect, afterEach, vi } from 'vitest';
import '../../../src/components/feedback/toast/toast.component';
import '../../../src/components/feedback/toast/toast-container.component';
import '../../../src/components/general/icon/icon.component';
import { ToastService } from '../../../src/components/feedback/toast/toast.service';
import { flush, createComponent, shadowQuery } from '../../helpers/component-test-utils';
import { installPopoverPolyfill } from '../../helpers/popover-polyfill';

describe('ml-toast', () => {
	let el: HTMLElement | null;

	afterEach(() => {
		el?.remove();
		el = null;
		document.querySelectorAll('ml-toast, ml-toast-container').forEach((n) => n.remove());
	});

	it('renders title from the toast-title attribute', async () => {
		el = createComponent('ml-toast', {
			attributes: { 'toast-title': 'Saved', message: 'All good', duration: '0' }
		});
		await flush();
		expect(shadowQuery(el, '.ml-toast__title')!.textContent).toContain('Saved');
	});

	it('maps the deprecated title attribute to toastTitle with a warning', async () => {
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		try {
			el = createComponent('ml-toast', {
				attributes: { title: 'Legacy', duration: '0' }
			});
			await flush();
			expect(shadowQuery(el, '.ml-toast__title')!.textContent).toContain('Legacy');
			expect((el as any).toastTitle).toBe('Legacy');
		} finally {
			warnSpy.mockRestore();
		}
	});
});

describe('ToastService', () => {
	afterEach(() => {
		document.querySelectorAll('ml-toast, ml-toast-container').forEach((n) => n.remove());
	});

	it('sets toast-title instead of the native title attribute (no browser tooltip)', async () => {
		const service = new ToastService();
		service.show({ variant: 'success', title: 'Saved', message: 'Done', duration: 0 });
		await flush();

		const toast = document.querySelector('ml-toast')!;
		expect(toast).toBeTruthy();
		expect(toast.getAttribute('toast-title')).toBe('Saved');
		// The reserved global attribute must not be set — it triggers a native tooltip
		expect(toast.hasAttribute('title')).toBe(false);

		await flush();
		expect(shadowQuery(toast as HTMLElement, '.ml-toast__title')!.textContent).toContain('Saved');
	});

	it('passes message/variant/duration through as before', async () => {
		const service = new ToastService();
		service.show({ variant: 'error', title: 'Oops', message: 'Broke', duration: 0 });
		await flush();

		const toast = document.querySelector('ml-toast')!;
		expect(toast.getAttribute('variant')).toBe('error');
		expect(toast.getAttribute('message')).toBe('Broke');
		expect(toast.getAttribute('duration')).toBe('0');
	});
});

describe('ml-toast auto-dismiss pause (WCAG 2.2.1)', () => {
	afterEach(() => {
		vi.useRealTimers();
		document.querySelectorAll('ml-toast, ml-toast-container').forEach((n) => n.remove());
	});

	it('holds the toast open while hovered and resumes with the remaining time', async () => {
		vi.useFakeTimers();
		const toast = createComponent('ml-toast', { attributes: { 'toast-title': 'Hi', duration: '1000' } });

		vi.advanceTimersByTime(600);
		toast.dispatchEvent(new Event('mouseenter'));
		vi.advanceTimersByTime(5000);
		expect(toast.isConnected).toBe(true);

		toast.dispatchEvent(new Event('mouseleave'));
		vi.advanceTimersByTime(300);
		expect(toast.isConnected).toBe(true);
		vi.advanceTimersByTime(200);
		expect(toast.isConnected).toBe(false);
	});

	it('stays paused while focus is inside even after the pointer leaves', async () => {
		vi.useFakeTimers();
		const toast = createComponent('ml-toast', { attributes: { 'toast-title': 'Hi', duration: '1000' } });

		toast.dispatchEvent(new Event('mouseenter'));
		toast.dispatchEvent(new Event('focusin'));
		toast.dispatchEvent(new Event('mouseleave'));
		vi.advanceTimersByTime(5000);
		expect(toast.isConnected).toBe(true);

		toast.dispatchEvent(new Event('focusout'));
		vi.advanceTimersByTime(1000);
		expect(toast.isConnected).toBe(false);
	});

	it('does not start a timer on hover-out when duration is 0', async () => {
		vi.useFakeTimers();
		const toast = createComponent('ml-toast', { attributes: { 'toast-title': 'Hi', duration: '0' } });
		toast.dispatchEvent(new Event('mouseenter'));
		toast.dispatchEvent(new Event('mouseleave'));
		vi.advanceTimersByTime(60000);
		expect(toast.isConnected).toBe(true);
	});
});

describe('toast live-region roles', () => {
	afterEach(() => {
		document.querySelectorAll('ml-toast, ml-toast-container').forEach((n) => n.remove());
	});

	it('does not repeat the role on the inner wrapper when the host carries it', async () => {
		const service = new ToastService();
		const ref = service.show({ variant: 'error', title: 'Failed', duration: 0 });
		await flush();
		expect(ref.element.getAttribute('role')).toBe('alert');
		expect(shadowQuery(ref.element, '.ml-toast')!.hasAttribute('role')).toBe(false);
	});

	it('keeps the role on the wrapper for a standalone <ml-toast>', async () => {
		const toast = createComponent('ml-toast', { attributes: { 'toast-title': 'Hi', duration: '0' } });
		await flush();
		expect(shadowQuery(toast, '.ml-toast')!.getAttribute('role')).toBe('status');
	});
});

describe('ToastService top-layer container', () => {
	afterEach(() => {
		document.querySelectorAll('ml-toast, ml-toast-container').forEach((n) => n.remove());
	});

	it('shows the container as a manual popover and re-raises it for each toast', async () => {
		installPopoverPolyfill();
		const service = new ToastService();
		service.show({ title: 'One', duration: 0 });
		const container = document.querySelector('ml-toast-container') as HTMLElement;
		expect(container.getAttribute('popover')).toBe('manual');

		const states: string[] = [];
		container.addEventListener('toggle', (event) => states.push((event as any).newState));
		service.show({ title: 'Two', duration: 0 });
		// Hidden then shown again: moved to the top of the top layer.
		expect(states).toEqual(['closed', 'open']);
	});
});
