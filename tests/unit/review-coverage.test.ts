import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { mount, flush, query, unmountAll } from '../../src/testing';
import { setDevMode, resetDevWarnings } from '../../src/devtools/dev-mode';
import { RouterService } from '../../src/routing/services/router.service';
import type { RouteParams } from '../../src/routing/types/route-params.type';

import '../../packages/melodic-components/src/components/forms/time-picker/index.js';
import '../../packages/melodic-components/src/components/forms/select/index.js';
import '../../packages/melodic-components/src/components/overlays/popover/index.js';
import '../../packages/melodic-components/src/components/sections/app-shell/index.js';
import '../../packages/melodic-components/src/components/navigation/tabs/index.js';

afterEach(async () => {
	await unmountAll();
	setDevMode(null);
	resetDevWarnings();
});

/** The user's component instance behind a mounted element. */
function instance<T>(element: HTMLElement): T {
	return (element as unknown as { component: T }).component;
}

/** S9 — a blocked back overwrote the wrong history entry. */
describe('blocked back/forward', () => {
	let router: RouterService;

	beforeEach(() => {
		history.replaceState(null, '', '/');
		router = new RouterService();
	});

	afterEach(() => {
		router.destroy();
	});

	it('steps back by the right delta instead of replacing an entry', async () => {
		router.setRoutes([
			{ path: 'a', component: 'x-a' },
			{ path: 'b', component: 'x-b' },
			{
				path: 'c',
				component: 'x-c',
				canDeactivate: [{ canDeactivate: () => false }]
			}
		]);

		await router.navigate('/a');
		await router.navigate('/b');
		await router.navigate('/c');

		// Emulate the browser having already moved back to /b: the URL changes
		// first, then popstate fires.
		const targetState = { __melodicHistoryIndex: (history.state as { __melodicHistoryIndex: number }).__melodicHistoryIndex - 1 };
		history.replaceState(targetState, '', '/b');

		const go = vi.spyOn(history, 'go').mockImplementation(() => undefined);
		const replaceState = vi.spyOn(history, 'replaceState');

		window.dispatchEvent(new PopStateEvent('popstate', { state: targetState }));
		await flush();

		// The guard blocked it: we return to where we were with go(+1), rather
		// than replaceState-ing over the entry the browser landed on.
		expect(go).toHaveBeenCalledWith(1);
		expect(replaceState).not.toHaveBeenCalled();

		go.mockRestore();
		replaceState.mockRestore();
	});

	it('ignores the corrective popstate its own go() produces', async () => {
		router.setRoutes([
			{ path: 'a', component: 'x-a' },
			{ path: 'b', component: 'x-b', canDeactivate: [{ canDeactivate: () => false }] }
		]);

		const guardRuns: number[] = [];
		router.setRoutes([
			{ path: 'a', component: 'x-a' },
			{
				path: 'b',
				component: 'x-b',
				canDeactivate: [
					{
						canDeactivate: () => {
							guardRuns.push(1);
							return false;
						}
					}
				]
			}
		]);

		await router.navigate('/a');
		await router.navigate('/b');

		const go = vi.spyOn(history, 'go').mockImplementation(() => undefined);
		const index = (history.state as { __melodicHistoryIndex: number }).__melodicHistoryIndex;

		history.replaceState({ __melodicHistoryIndex: index - 1 }, '', '/a');
		window.dispatchEvent(new PopStateEvent('popstate', { state: { __melodicHistoryIndex: index - 1 } }));
		await flush();
		expect(guardRuns).toHaveLength(1);

		// The correction the router itself triggered must not re-run the guard.
		history.replaceState({ __melodicHistoryIndex: index }, '', '/b');
		window.dispatchEvent(new PopStateEvent('popstate', { state: { __melodicHistoryIndex: index } }));
		await flush();
		expect(guardRuns).toHaveLength(1);

		go.mockRestore();
	});
});

/** S10 — hash scrolling could not reach routed (shadow DOM) content. */
describe('hash scrolling', () => {
	let router: RouterService;

	beforeEach(() => {
		history.replaceState(null, '', '/');
		router = new RouterService();
	});

	afterEach(() => {
		router.destroy();
	});

	it('finds an anchor inside a shadow root', async () => {
		const host = document.createElement('div');
		const shadow = host.attachShadow({ mode: 'open' });
		const target = document.createElement('h2');
		target.id = 'deep-section';
		const scrollIntoView = vi.fn();
		(target as unknown as { scrollIntoView: () => void }).scrollIntoView = scrollIntoView;
		shadow.appendChild(target);
		document.body.appendChild(host);

		router.setRoutes([{ path: 'docs', component: 'x-docs' }]);
		await router.navigate('/docs#deep-section');

		// The scroll is deferred until after the outlet has rendered.
		await new Promise((resolve) => setTimeout(resolve, 30));

		expect(scrollIntoView).toHaveBeenCalled();
		host.remove();
	});

	it('scrolls to the top when there is no hash', async () => {
		const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);

		router.setRoutes([{ path: 'top', component: 'x-top' }]);
		await router.navigate('/top');

		expect(scrollTo).toHaveBeenCalledWith(0, 0);
		scrollTo.mockRestore();
	});

	it('respects scrollToTop: false', async () => {
		const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);

		router.setRoutes([{ path: 'stay', component: 'x-stay' }]);
		await router.navigate('/stay', { scrollToTop: false });

		expect(scrollTo).not.toHaveBeenCalled();
		scrollTo.mockRestore();
	});
});

/** D3 — route params were `Record<string, string>` everywhere. */
describe('typed route params', () => {
	it('infers the declared names from the path', () => {
		// Compile-time assertions: these fail `tsc` if the inference breaks.
		const single: RouteParams<'users/:id'> = { id: '1' };
		const nested: RouteParams<'users/:userId/posts/:postId'> = { userId: '1', postId: '2' };
		const splat: RouteParams<'files/*path'> = { path: 'a/b' };

		expect(single.id).toBe('1');
		expect(nested.postId).toBe('2');
		expect(splat.path).toBe('a/b');
	});

	it('falls back to the untyped record for a plain string', () => {
		const untyped: RouteParams<string> = { anything: 'goes' };
		expect(untyped.anything).toBe('goes');
	});
});

/** C6 — the time picker stole focus on every close and ignored min/max. */
describe('ml-time-picker', () => {
	it('clamps the edited time into the min/max window', async () => {
		const picker = await mount('ml-time-picker', {}, { attributes: { min: '09:00', max: '17:00' } });
		await flush();

		const host = instance<{
			editHour: number;
			editMinute: number;
			confirmSelection: () => void;
			value: string;
		}>(picker);

		host.editHour = 6;
		host.editMinute = 30;
		host.confirmSelection();
		await flush();
		expect(host.value).toBe('09:00');

		host.editHour = 22;
		host.editMinute = 15;
		host.confirmSelection();
		await flush();
		expect(host.value).toBe('17:00');
	});

	it('leaves a time inside the window alone', async () => {
		const picker = await mount('ml-time-picker', {}, { attributes: { min: '09:00', max: '17:00' } });
		await flush();

		const host = instance<{ editHour: number; editMinute: number; confirmSelection: () => void; value: string }>(picker);
		host.editHour = 12;
		host.editMinute = 45;
		host.confirmSelection();
		await flush();

		expect(host.value).toBe('12:45');
	});
});

/** C7 — Enter from the search input could not commit in multiple mode. */
describe('ml-select Enter from the search input', () => {
	it('commits the focused option', async () => {
		const select = await mount('ml-select', {
			multiple: true,
			options: [
				{ value: 'a', label: 'A' },
				{ value: 'b', label: 'B' }
			]
		});

		const host = instance<{ isOpen: boolean; focusedIndex: number; values: string[] }>(select);
		host.isOpen = true;
		await flush();
		host.focusedIndex = 1;

		// Multiple mode keeps focus in the search input for the whole
		// interaction, so Enter has to commit from there.
		const search = query<HTMLInputElement>(select, '.ml-select__search');
		expect(search).not.toBeNull();

		search!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, composed: true, cancelable: true }));
		await flush();

		expect(host.values).toContain('b');
	});

	it('still lets Space type a space in the search box', async () => {
		const select = await mount('ml-select', {
			multiple: true,
			options: [{ value: 'a', label: 'A' }]
		});

		const host = instance<{ isOpen: boolean; focusedIndex: number }>(select);
		host.isOpen = true;
		host.focusedIndex = 0;
		await flush();

		const search = query<HTMLInputElement>(select, '.ml-select__search');
		if (!search) {
			return; // no search box rendered in this configuration
		}

		const event = new KeyboardEvent('keydown', { key: ' ', bubbles: true, composed: true, cancelable: true });
		search.dispatchEvent(event);

		expect(event.defaultPrevented).toBe(false);
	});
});

/** C19 — a manual popover trapped focus with no Escape exit. */
describe('ml-popover manual mode', () => {
	it('closes on Escape', async () => {
		const popover = await mount('ml-popover', {}, { attributes: { manual: '' } });
		await flush();

		const popoverEl = query<HTMLElement & { hidePopover?: () => void }>(popover, '.ml-popover__content');
		expect(popoverEl).not.toBeNull();

		const hide = vi.fn();
		popoverEl!.hidePopover = hide;
		instance<{ isOpen: boolean }>(popover).isOpen = true;
		await flush();

		const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
		popoverEl!.dispatchEvent(event);

		expect(event.defaultPrevented).toBe(true);
		expect(hide).toHaveBeenCalled();
	});

	it('leaves Escape alone when it is not manual', async () => {
		const popover = await mount('ml-popover');
		await flush();

		const popoverEl = query<HTMLElement>(popover, '.ml-popover__content')!;
		instance<{ isOpen: boolean }>(popover).isOpen = true;
		await flush();

		const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
		popoverEl.dispatchEvent(event);

		// The platform's own close-watcher handles a non-manual popover.
		expect(event.defaultPrevented).toBe(false);
	});
});

/** C30 — sidebar-collapsed had no CSS, the drawer had no keyboard dismissal. */
describe('ml-app-shell', () => {
	it('closes the mobile drawer on Escape', async () => {
		const shell = await mount('ml-app-shell');
		const host = instance<{ mobile: boolean; mobileOpen: boolean; handleKeyDown: (event: KeyboardEvent) => void }>(shell);
		host.mobile = true;
		host.mobileOpen = true;
		await flush();

		const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
		query<HTMLElement>(shell, '.ml-app-shell')!.dispatchEvent(event);
		await flush();

		expect(host.mobileOpen).toBe(false);
	});

	it('marks the menu button expanded and the sidebar hidden appropriately', async () => {
		const shell = await mount('ml-app-shell');
		const host = instance<{ mobile: boolean; mobileOpen: boolean }>(shell);
		host.mobile = true;
		await flush();

		expect(query(shell, '.ml-app-shell__menu-btn')!.getAttribute('aria-expanded')).toBe('false');
		expect(query(shell, '.ml-app-shell__sidebar')!.getAttribute('aria-hidden')).toBe('true');

		host.mobileOpen = true;
		await flush();

		expect(query(shell, '.ml-app-shell__menu-btn')!.getAttribute('aria-expanded')).toBe('true');
		expect(query(shell, '.ml-app-shell__sidebar')!.getAttribute('aria-hidden')).toBe('false');
	});

	it('declares a collapsed sidebar width token', async () => {
		const shell = await mount('ml-app-shell');
		await flush();

		const styles = shell.shadowRoot!.adoptedStyleSheets.length > 0 ? [...shell.shadowRoot!.adoptedStyleSheets].map((sheet) => [...sheet.cssRules].map((rule) => rule.cssText).join('')).join('') : (shell.shadowRoot!.querySelector('style')?.textContent ?? '');

		expect(styles).toContain('--ml-app-shell-sidebar-collapsed-width');
		expect(styles).toContain('ml-app-shell--sidebar-collapsed');
	});
});

/** C32 — `routed` was read once, in onCreate, to decide listener attachment. */
describe('toggling routed after mount', () => {
	it('attaches and detaches the navigation listener', async () => {
		const add = vi.spyOn(window, 'addEventListener');
		const remove = vi.spyOn(window, 'removeEventListener');

		const tabs = await mount('ml-tabs', { tabs: [{ value: 'a', label: 'A', href: '/a' }] });
		await flush();

		const navAdds = (): number => add.mock.calls.filter((call) => call[0] === 'NavigationEvent').length;
		const navRemoves = (): number => remove.mock.calls.filter((call) => call[0] === 'NavigationEvent').length;

		const before = navAdds();
		(tabs as unknown as { routed: boolean }).routed = true;
		await flush();
		expect(navAdds()).toBe(before + 1);

		const removesBefore = navRemoves();
		(tabs as unknown as { routed: boolean }).routed = false;
		await flush();
		expect(navRemoves()).toBe(removesBefore + 1);

		add.mockRestore();
		remove.mockRestore();
	});
});
