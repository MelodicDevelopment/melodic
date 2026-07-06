import { describe, it, expect, afterEach, vi } from 'vitest';
import '../../../src/components/feedback/toast/toast.component';
import '../../../src/components/feedback/toast/toast-container.component';
import '../../../src/components/general/icon/icon.component';
import { ToastService } from '../../../src/components/feedback/toast/toast.service';
import { flush, createComponent, shadowQuery } from '../../helpers/component-test-utils';

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
