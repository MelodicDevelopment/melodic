import { describe, it, expect, afterEach, vi } from 'vitest';
import { mount, flush, query, queryAll, unmountAll } from '../../src/testing';
import { setDevMode, resetDevWarnings } from '../../src/devtools/dev-mode';
import { routeAnchorClick } from '../../packages/melodic-components/src/components/navigation/functions/route-link.function.js';
import { memoOn } from '../../packages/melodic-components/src/components/data-display/table-core/memo.js';
import { Injector } from '../../src/injection';
import { RouterService } from '../../src/routing/services/router.service';

import '../../packages/melodic-components/src/components/forms/select/index.js';
import '../../packages/melodic-components/src/components/forms/autocomplete/index.js';
import '../../packages/melodic-components/src/components/forms/file-upload/index.js';
import '../../packages/melodic-components/src/components/forms/date-picker/index.js';
import '../../packages/melodic-components/src/components/navigation/sidebar/index.js';
import '../../packages/melodic-components/src/components/data-display/calendar-view/index.js';
import '../../packages/melodic-components/src/components/foundation/stack/index.js';
import '../../packages/melodic-components/src/components/foundation/container/index.js';

afterEach(async () => {
	await unmountAll();
	setDevMode(null);
	resetDevWarnings();
});

/** happy-dom implements no Popover API; give every shadow element a no-op one. */
function stubPopover(element: HTMLElement): void {
	for (const node of element.shadowRoot?.querySelectorAll('*') ?? []) {
		const target = node as HTMLElement & { showPopover?: () => void; hidePopover?: () => void; togglePopover?: () => void };
		target.showPopover ??= () => undefined;
		target.hidePopover ??= () => undefined;
		target.togglePopover ??= () => undefined;
	}
}

/** The user's component instance behind a mounted element. */
function instance<T>(element: HTMLElement): T {
	return (element as unknown as { component: T }).component;
}

/** C4 — Escape was swallowed even when the listbox was closed. */
describe('Escape while closed', () => {
	for (const tag of ['ml-select', 'ml-autocomplete']) {
		it(`${tag} lets Escape through when it is not open`, async () => {
			const element = await mount(tag, { options: [{ value: 'a', label: 'A' }] });
			await flush();

			const closed = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
			element.dispatchEvent(closed);

			// Not cancelled: the platform close-watcher still sees it, so an
			// enclosing dialog or drawer can be dismissed.
			expect(closed.defaultPrevented).toBe(false);
		});

		it(`${tag} claims Escape while it IS open`, async () => {
			const element = await mount(tag, { options: [{ value: 'a', label: 'A' }] });
			// happy-dom has no Popover API; the close path calls hidePopover().
			stubPopover(element);
			(element as unknown as { isOpen: boolean }).isOpen = true;
			await flush();
			stubPopover(element);

			const open = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
			element.dispatchEvent(open);

			// Claimed, so the dropdown closes rather than the enclosing dialog.
			// (Whether `isOpen` flips synchronously depends on the component's
			// popover wiring, which happy-dom does not implement.)
			expect(open.defaultPrevented).toBe(true);
		});
	}
});

/** C12 — maxFiles counted per batch, and the two change paths disagreed. */
describe('ml-file-upload', () => {
	const makeFile = (name: string): File => new File(['x'], name, { type: 'text/plain' });

	it('caps maxFiles across the whole selection, not per batch', async () => {
		const upload = await mount('ml-file-upload', { multiple: true, maxFiles: 2 });
		await flush();

		const host = instance<{ files: File[]; processFiles: (files: File[]) => void }>(upload);

		host.processFiles([makeFile('a.txt'), makeFile('b.txt')]);
		await flush();
		expect(host.files).toHaveLength(2);

		host.processFiles([makeFile('c.txt')]);
		await flush();
		expect(host.files).toHaveLength(2);
	});

	it('reports the full selection on both change paths', async () => {
		const upload = await mount('ml-file-upload', { multiple: true });
		await flush();

		const details: File[][] = [];
		upload.addEventListener('ml:change', (event) => details.push((event as CustomEvent<{ files: File[] }>).detail.files));

		const host = instance<{ processFiles: (files: File[]) => void; removeFile: (file: File) => void }>(upload);
		const first = makeFile('a.txt');

		host.processFiles([first, makeFile('b.txt')]);
		await flush();
		expect(details.at(-1)).toHaveLength(2);

		host.removeFile(first);
		await flush();
		expect(details.at(-1)).toHaveLength(1);
	});
});

/** C13 — a rejected searchFn became an unhandled rejection. */
describe('ml-autocomplete search failures', () => {
	it('emits ml:search-error and clears loading', async () => {
		const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);

		const autocomplete = await mount('ml-autocomplete', {
			debounce: 0,
			searchFn: () => Promise.reject(new Error('network down'))
		});
		await flush();

		const errors: unknown[] = [];
		autocomplete.addEventListener('ml:search-error', (event) => errors.push((event as CustomEvent).detail));

		// executeSearch is private; reach it the way the debounce timer does.
		await (instance<Record<string, (query: string) => Promise<void>>>(autocomplete).executeSearch)('abc');
		await flush();

		expect(errors).toHaveLength(1);
		expect((autocomplete as unknown as { loading: boolean }).loading).toBe(false);
		error.mockRestore();
	});
});

/** C20 — the calendar only navigated on an attribute write. */
describe('ml-date-picker value', () => {
	it('formats a value using the given locale', async () => {
		const picker = await mount('ml-date-picker', {}, { attributes: { value: '2001-02-03', locale: 'en-GB' } });
		await flush();

		// en-GB is day/month/year.
		expect(query<HTMLInputElement>(picker, 'input')!.value).toBe('03/02/2001');
	});

	it('formats the same value differently for en-US', async () => {
		const picker = await mount('ml-date-picker', {}, { attributes: { value: '2001-02-03', locale: 'en-US' } });
		await flush();

		expect(query<HTMLInputElement>(picker, 'input')!.value).toBe('02/03/2001');
	});
});

/** C24 — sidebar slots sat behind non-reactive getters inside when(). */
describe('ml-sidebar slot presence', () => {
	it('notices content slotted after mount', async () => {
		const sidebar = await mount('ml-sidebar');
		await flush();

		expect((sidebar as unknown as { hasUser: boolean }).hasUser).toBe(false);

		const user = document.createElement('div');
		user.setAttribute('slot', 'user');
		sidebar.appendChild(user);
		await flush();

		expect((sidebar as unknown as { hasUser: boolean }).hasUser).toBe(true);

		user.remove();
		await flush();
		expect((sidebar as unknown as { hasUser: boolean }).hasUser).toBe(false);
	});
});

/** C5 — mini-calendar prev/next mutated `_`-prefixed (non-reactive) fields. */
describe('ml-calendar-view mini calendar', () => {
	it('re-renders when the month is changed', async () => {
		const calendar = await mount('ml-calendar-view', {}, { attributes: { view: 'day', date: '2026-06-15' } });
		await flush();

		const host = instance<{ miniCalMonth: number; miniCalPrevMonth: () => void; miniCalendarTitle: string }>(calendar);
		const before = host.miniCalendarTitle;

		host.miniCalPrevMonth();
		await flush();

		expect(host.miniCalendarTitle).not.toBe(before);
	});

	it('uses the locale for month names', async () => {
		const calendar = await mount('ml-calendar-view', {}, { attributes: { date: '2026-06-15', locale: 'fr-FR' } });
		await flush();

		const title = instance<{ miniCalendarTitle: string }>(calendar).miniCalendarTitle;
		expect(title.toLowerCase()).toContain('juin');
	});
});

/** C36 — ml-stack / ml-container drove layout through inline styles. */
describe('layout components', () => {
	it('ml-stack exposes its layout as custom properties', async () => {
		const stack = await mount('ml-stack', {}, { attributes: { direction: 'vertical', gap: '2' } });
		await flush();

		const inner = query<HTMLElement>(stack, '.ml-stack')!;
		expect(inner.style.getPropertyValue('--ml-stack-direction')).toBe('column');
		expect(inner.style.getPropertyValue('--ml-stack-gap')).toContain('--ml-space-2');
		// No inline layout declaration that a stylesheet could not override.
		expect(inner.style.flexDirection).toBe('');
	});

	it('ml-container exposes its max-width as a custom property', async () => {
		const container = await mount('ml-container', {}, { attributes: { size: 'sm' } });
		await flush();

		const inner = query<HTMLElement>(container, '.ml-container')!;
		expect(inner.style.getPropertyValue('--ml-container-max-width')).toBe('640px');
		expect(inner.style.maxWidth).toBe('');
	});
});

/** C31 — navigation anchors triggered a full page load. */
describe('routeAnchorClick', () => {
	it('routes an internal link when a router is registered', () => {
		const router = Injector.get<RouterService>(RouterService);
		const navigate = vi.spyOn(router, 'navigate').mockResolvedValue({ success: true, url: '/x' });

		const event = new MouseEvent('click', { button: 0, cancelable: true });
		expect(routeAnchorClick(event, '/settings')).toBe(true);
		expect(event.defaultPrevented).toBe(true);
		expect(navigate).toHaveBeenCalledWith('/settings');

		navigate.mockRestore();
	});

	it('leaves modifier clicks, external links and other schemes to the browser', () => {
		const modified = new MouseEvent('click', { button: 0, metaKey: true, cancelable: true });
		expect(routeAnchorClick(modified, '/settings')).toBe(false);
		expect(modified.defaultPrevented).toBe(false);

		const middle = new MouseEvent('click', { button: 1, cancelable: true });
		expect(routeAnchorClick(middle, '/settings')).toBe(false);

		const external = new MouseEvent('click', { button: 0, cancelable: true });
		expect(routeAnchorClick(external, '/settings', { external: true })).toBe(false);

		const mailto = new MouseEvent('click', { button: 0, cancelable: true });
		expect(routeAnchorClick(mailto, 'mailto:someone@example.com')).toBe(false);

		const newTab = new MouseEvent('click', { button: 0, cancelable: true });
		expect(routeAnchorClick(newTab, '/settings', { target: '_blank' })).toBe(false);
	});
});

/** C14 — the row pipeline was recomputed on every scroll event. */
describe('memoOn', () => {
	it('recomputes only when a dependency changes', () => {
		const memo = memoOn<number[]>();
		let runs = 0;

		const rows = [1, 2, 3];
		const compute = (): number[] => {
			runs++;
			return [...rows].sort();
		};

		memo([rows, 'asc'], compute);
		memo([rows, 'asc'], compute);
		memo([rows, 'asc'], compute);
		expect(runs).toBe(1);

		memo([rows, 'desc'], compute);
		expect(runs).toBe(2);

		memo([[...rows], 'desc'], compute); // new array identity
		expect(runs).toBe(3);
	});

	it('returns the same reference for an unchanged computation', () => {
		const memo = memoOn<number[]>();
		const rows = [1];

		const first = memo([rows], () => [...rows]);
		const second = memo([rows], () => [...rows]);

		expect(second).toBe(first);
	});
});

/** C16 — option keys embedded selection state, rebuilding DOM on every toggle. */
describe('ml-select option identity', () => {
	it('keeps the same option element across a selection change', async () => {
		const select = await mount('ml-select', {
			options: [
				{ value: 'a', label: 'A' },
				{ value: 'b', label: 'B' }
			]
		});
		(select as unknown as { isOpen: boolean }).isOpen = true;
		await flush();

		const before = queryAll(select, '.ml-select__option');
		expect(before.length).toBeGreaterThan(0);

		(select as unknown as { value: string }).value = 'b';
		await flush();

		const after = queryAll(select, '.ml-select__option');
		expect(after[0]).toBe(before[0]);
		expect(after[1]).toBe(before[1]);
	});
});

/** C15 — a column resize re-rendered every row on each pointermove. */
describe('ml-data-grid column resize', () => {
	it('drives the live drag through a CSS variable, committing once on pointerup', async () => {
		await import('../../packages/melodic-components/src/components/data-display/data-grid/index.js');

		const grid = await mount('ml-data-grid', {
			columns: [
				{ key: 'a', label: 'A', width: 120 },
				{ key: 'b', label: 'B', width: 120 }
			],
			rows: [{ a: 1, b: 2 }]
		});
		await flush();

		const host = instance<{
			resizingKey: string | null;
			colWidths: Record<string, number>;
			handleResizeMove: (key: string, event: PointerEvent) => void;
			handleResizeEnd: () => void;
			gridTemplateColumns: string;
		}>(grid);

		// The template reads the width through a custom property, so a live
		// drag needs no re-render at all.
		expect(host.gridTemplateColumns).toContain('var(--ml-grid-col-a');

		const committedBefore = host.colWidths.a;

		host.resizingKey = 'a';
		host.handleResizeMove('a', { clientX: 200 } as PointerEvent);

		// The live drag writes only the CSS variable; the committed width — the
		// one a render would read — is untouched, so no row re-renders.
		expect(grid.style.getPropertyValue('--ml-grid-col-a')).not.toBe('');
		expect(host.colWidths.a).toBe(committedBefore);

		host.handleResizeEnd();
		await flush();

		expect(host.colWidths.a).not.toBe(committedBefore);
		expect(grid.style.getPropertyValue('--ml-grid-col-a')).toBe('');
	});
});

/** C18 — calendar-view day cells and event pills were click-only divs. */
describe('ml-calendar-view keyboard access', () => {
	it('gives day cells a roving tab stop and Enter activation', async () => {
		const calendar = await mount('ml-calendar-view', {}, { attributes: { view: 'month', date: '2026-06-15' } });
		await flush();

		const cells = queryAll<HTMLElement>(calendar, '.ml-cv__day-cell');
		expect(cells.length).toBeGreaterThan(0);
		expect(cells.filter((cell) => cell.getAttribute('tabindex') === '0')).toHaveLength(1);
		expect(cells[0].getAttribute('role')).toBe('gridcell');

		const clicks: string[] = [];
		calendar.addEventListener('ml:date-click', (event) => clicks.push((event as CustomEvent<{ date: string }>).detail.date));

		const tabStop = cells.find((cell) => cell.getAttribute('tabindex') === '0')!;
		tabStop.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, composed: true, cancelable: true }));
		await flush();

		expect(clicks).toHaveLength(1);
	});

	it('moves the tab stop with the arrow keys', async () => {
		const calendar = await mount('ml-calendar-view', {}, { attributes: { view: 'month', date: '2026-06-15' } });
		await flush();

		const before = queryAll<HTMLElement>(calendar, '.ml-cv__day-cell').find((cell) => cell.getAttribute('tabindex') === '0')!;
		before.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, composed: true, cancelable: true }));
		await flush();

		const after = queryAll<HTMLElement>(calendar, '.ml-cv__day-cell').find((cell) => cell.getAttribute('tabindex') === '0')!;
		expect(after.dataset.key).not.toBe(before.dataset.key);
	});

	it('makes event pills focusable and activatable', async () => {
		const calendar = await mount('ml-calendar-view', {
			events: [{ id: '1', title: 'Standup', start: '2026-06-15T09:00:00', end: '2026-06-15T09:15:00' }]
		}, { attributes: { view: 'month', date: '2026-06-15' } });
		await flush();

		const pill = query<HTMLElement>(calendar, '.ml-cv__event-pill');
		expect(pill).not.toBeNull();
		expect(pill!.getAttribute('role')).toBe('button');
		expect(pill!.getAttribute('tabindex')).toBe('0');

		const opened: unknown[] = [];
		calendar.addEventListener('ml:event-click', (event) => opened.push((event as CustomEvent).detail));

		pill!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, composed: true, cancelable: true }));
		await flush();

		expect(opened).toHaveLength(1);
	});
});

/** C20 — the calendar navigated only on an attribute write. */
describe('ml-calendar property writes', () => {
	it('navigates the view when `value` is set as a property', async () => {
		await import('../../packages/melodic-components/src/components/forms/date-picker/index.js');

		const calendar = await mount('ml-calendar');
		await flush();

		const host = instance<{ value: string; viewYear: number; viewMonth: number }>(calendar);
		host.value = '2030-11-04';
		await flush();

		expect(host.viewYear).toBe(2030);
		expect(host.viewMonth).toBe(10);
	});
});
