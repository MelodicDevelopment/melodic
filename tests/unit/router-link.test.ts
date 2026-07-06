import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Injector } from '../../src/injection';
import { RouterService, isSafeUrl } from '../../src/routing';
import { routerLinkDirective } from '../../src/routing/directives/router-link.directive';
// Importing the component module registers the <router-link> custom element.
import '../../src/routing/components/router-link/router-link.component';

const tick = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

describe('router link (shared core: directive + element)', () => {
	const cleanups: (() => void)[] = [];
	const elements: Element[] = [];

	function mount<K extends keyof HTMLElementTagNameMap>(tag: K): HTMLElementTagNameMap[K] {
		const element = document.createElement(tag);
		document.body.appendChild(element);
		elements.push(element);
		return element;
	}

	function applyDirective(element: Element, value: unknown): void {
		const cleanup = routerLinkDirective(element, value, '');
		if (cleanup) {
			cleanups.push(cleanup);
		}
	}

	beforeEach(() => {
		history.replaceState(null, '', '/');
		Injector.get(RouterService).setRoutes([]);
	});

	afterEach(() => {
		cleanups.splice(0).forEach((cleanup) => cleanup());
		elements.splice(0).forEach((element) => element.remove());
		vi.restoreAllMocks();
	});

	describe('isSafeUrl', () => {
		it('allows relative, hash, query and http(s) URLs', () => {
			expect(isSafeUrl('/home')).toBe(true);
			expect(isSafeUrl('home')).toBe(true);
			expect(isSafeUrl('../up')).toBe(true);
			expect(isSafeUrl('#section')).toBe(true);
			expect(isSafeUrl('?page=2')).toBe(true);
			expect(isSafeUrl('http://example.com/x')).toBe(true);
			expect(isSafeUrl('https://example.com/x')).toBe(true);
			expect(isSafeUrl('')).toBe(true);
		});

		it('rejects script-capable and unknown schemes, including obfuscated ones', () => {
			expect(isSafeUrl('javascript:alert(1)')).toBe(false);
			expect(isSafeUrl('JavaScript:alert(1)')).toBe(false);
			expect(isSafeUrl(' javascript:alert(1)')).toBe(false);
			expect(isSafeUrl('java\tscript:alert(1)')).toBe(false);
			expect(isSafeUrl('java\nscript:alert(1)')).toBe(false);
			expect(isSafeUrl('data:text/html,<script>1</script>')).toBe(false);
			expect(isSafeUrl('vbscript:msgbox(1)')).toBe(false);
		});
	});

	describe(':routerLink directive', () => {
		it('never assigns a javascript: URL to href', () => {
			const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
			const anchor = mount('a');

			applyDirective(anchor, 'javascript:alert(1)');

			expect(anchor.getAttribute('href')).toBeNull();
			expect(warn).toHaveBeenCalled();
		});

		it('never passes an unsafe URL to window.open', () => {
			vi.spyOn(console, 'warn').mockImplementation(() => {});
			const open = vi.spyOn(window, 'open').mockImplementation(() => null);
			const button = mount('button');

			applyDirective(button, 'javascript:alert(1)');

			button.dispatchEvent(new MouseEvent('click', { ctrlKey: true, bubbles: true, cancelable: true }));
			button.dispatchEvent(new MouseEvent('auxclick', { button: 1, bubbles: true, cancelable: true }));

			expect(open).not.toHaveBeenCalled();
		});

		it('sets href (merging query params) for safe URLs on anchors', () => {
			const anchor = mount('a');

			applyDirective(anchor, { href: '/list?page=2', queryParams: { sort: 'asc' } });

			expect(anchor.getAttribute('href')).toBe('/list?page=2&sort=asc');
		});

		it('lets the browser handle modifier clicks on anchors (no preventDefault)', () => {
			// No SPA navigation may happen — the browser owns modifier clicks.
			const navigate = vi.spyOn(Injector.get(RouterService), 'navigate');
			const anchor = mount('a');
			applyDirective(anchor, '/somewhere');

			for (const init of [{ ctrlKey: true }, { metaKey: true }, { shiftKey: true }, { altKey: true }]) {
				const event = new MouseEvent('click', { ...init, bubbles: true, cancelable: true });
				anchor.dispatchEvent(event);
				// Native behavior preserved (happy-dom follows the un-prevented
				// anchor click itself, which is exactly the passthrough we want).
				expect(event.defaultPrevented).toBe(false);
			}

			expect(navigate).not.toHaveBeenCalled();
		});

		it('navigates (with preventDefault) on plain left click', async () => {
			const anchor = mount('a');
			applyDirective(anchor, '/dest');

			const event = new MouseEvent('click', { bubbles: true, cancelable: true });
			anchor.dispatchEvent(event);

			expect(event.defaultPrevented).toBe(true);
			await tick();
			expect(window.location.pathname).toBe('/dest');
		});

		it('opens a new tab for modifier clicks on non-anchor elements', () => {
			const open = vi.spyOn(window, 'open').mockImplementation(() => null);
			const button = mount('button');
			applyDirective(button, '/admin');

			button.dispatchEvent(new MouseEvent('click', { ctrlKey: true, bubbles: true, cancelable: true }));

			expect(open).toHaveBeenCalledWith('/admin', '_blank');
			expect(window.location.pathname).toBe('/');
		});

		it('handles middle click (auxclick) on non-anchor elements', () => {
			const open = vi.spyOn(window, 'open').mockImplementation(() => null);
			const button = mount('button');
			applyDirective(button, '/admin');

			button.dispatchEvent(new MouseEvent('auxclick', { button: 1, bubbles: true, cancelable: true }));

			expect(open).toHaveBeenCalledWith('/admin', '_blank');
		});
	});

	describe('<router-link> element', () => {
		it('lets the browser handle modifier clicks (no preventDefault, no window.open)', async () => {
			const open = vi.spyOn(window, 'open').mockImplementation(() => null);
			const link = mount('router-link' as keyof HTMLElementTagNameMap);
			link.setAttribute('href', '/somewhere');
			await tick();

			const event = new MouseEvent('click', { ctrlKey: true, bubbles: true, cancelable: true, composed: true });
			link.dispatchEvent(event);

			// Regression: the element used to preventDefault + window.open on
			// modifier clicks, defeating native new-tab behavior.
			expect(event.defaultPrevented).toBe(false);
			expect(open).not.toHaveBeenCalled();
			expect(window.location.pathname).toBe('/');
		});

		it('navigates on plain left click', async () => {
			const link = mount('router-link' as keyof HTMLElementTagNameMap);
			link.setAttribute('href', '/element-dest');
			await tick();

			const event = new MouseEvent('click', { bubbles: true, cancelable: true, composed: true });
			link.dispatchEvent(event);

			expect(event.defaultPrevented).toBe(true);
			await tick();
			expect(window.location.pathname).toBe('/element-dest');
		});

		it('exposes the (safe) href on its internal anchor', async () => {
			const link = mount('router-link' as keyof HTMLElementTagNameMap);
			link.setAttribute('href', '/about');
			await tick();

			const anchor = link.shadowRoot?.querySelector('a');
			expect(anchor?.getAttribute('href')).toBe('/about');
		});

		it('never assigns an unsafe href to its internal anchor', async () => {
			vi.spyOn(console, 'warn').mockImplementation(() => {});
			const link = mount('router-link' as keyof HTMLElementTagNameMap);
			link.setAttribute('href', 'javascript:alert(1)');
			await tick();

			const anchor = link.shadowRoot?.querySelector('a');
			expect(anchor?.getAttribute('href')).toBeNull();
		});
	});
});
