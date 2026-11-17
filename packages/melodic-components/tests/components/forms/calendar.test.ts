import { describe, it, expect, afterEach } from 'vitest';
import '../../../src/components/forms/date-picker/calendar.component';
import { flush, createComponent, removeComponent } from '../../helpers/component-test-utils';

/**
 * Day-grid keyboard navigation follows the WAI-ARIA date picker pattern.
 * It used to be index arithmetic over the visible month's enabled buttons:
 * arrows stopped dead at the month's edges, there was no PageUp/PageDown, and
 * Home/End jumped to the first/last day of the whole month.
 */
describe('ml-calendar keyboard navigation', () => {
	let el: any;

	afterEach(() => {
		if (el) removeComponent(el);
	});

	async function mount(attributes: Record<string, string>): Promise<void> {
		el = createComponent('ml-calendar', { attributes });
		await flush();
		await flush();
	}

	function cell(iso: string): HTMLButtonElement {
		return el.shadowRoot.querySelector(`.ml-calendar__grid button[data-key="${iso}"]`);
	}

	function focusedKey(): string | undefined {
		return (el.shadowRoot.activeElement as HTMLElement | null)?.dataset.key;
	}

	async function press(from: string, key: string, init: KeyboardEventInit = {}): Promise<KeyboardEvent> {
		const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init });
		cell(from).dispatchEvent(event);
		await flush();
		await flush();
		return event;
	}

	it('moves by a day and by a week within the month', async () => {
		await mount({ value: '2026-02-11' });
		cell('2026-02-11').focus();

		await press('2026-02-11', 'ArrowRight');
		expect(focusedKey()).toBe('2026-02-12');
		await press('2026-02-12', 'ArrowDown');
		expect(focusedKey()).toBe('2026-02-19');
		await press('2026-02-19', 'ArrowLeft');
		expect(focusedKey()).toBe('2026-02-18');
		await press('2026-02-18', 'ArrowUp');
		expect(focusedKey()).toBe('2026-02-11');
	});

	it('crosses into the next and previous month', async () => {
		await mount({ value: '2026-02-28' });

		const forward = await press('2026-02-28', 'ArrowRight');
		expect(forward.defaultPrevented).toBe(true);
		expect(el.component.viewMonth).toBe(2);
		expect(focusedKey()).toBe('2026-03-01');

		await press('2026-03-01', 'ArrowUp');
		expect(el.component.viewMonth).toBe(1);
		expect(focusedKey()).toBe('2026-02-22');
	});

	it('crosses a year boundary', async () => {
		await mount({ value: '2026-12-31' });
		await press('2026-12-31', 'ArrowRight');
		expect(el.component.viewYear).toBe(2027);
		expect(el.component.viewMonth).toBe(0);
		expect(focusedKey()).toBe('2027-01-01');
	});

	it('PageDown / PageUp move a month, clamping the day; Shift moves a year', async () => {
		await mount({ value: '2026-01-31' });

		await press('2026-01-31', 'PageDown');
		expect(focusedKey()).toBe('2026-02-28');

		await press('2026-02-28', 'PageUp');
		expect(focusedKey()).toBe('2026-01-28');

		await press('2026-01-28', 'PageDown', { shiftKey: true });
		expect(focusedKey()).toBe('2027-01-28');

		await press('2027-01-28', 'PageUp', { shiftKey: true });
		expect(focusedKey()).toBe('2026-01-28');
	});

	it('Home / End go to the start / end of the week', async () => {
		// 2026-02-11 is a Wednesday; its week runs Sun 8 – Sat 14.
		await mount({ value: '2026-02-11' });

		await press('2026-02-11', 'Home');
		expect(focusedKey()).toBe('2026-02-08');
		await press('2026-02-08', 'End');
		expect(focusedKey()).toBe('2026-02-14');
	});

	it('does not move onto a date outside min / max', async () => {
		await mount({ value: '2026-02-10', min: '2026-02-10', max: '2026-02-12' });
		cell('2026-02-10').focus();

		const blocked = await press('2026-02-10', 'ArrowLeft');
		expect(blocked.defaultPrevented).toBe(true);
		expect(focusedKey()).toBe('2026-02-10');

		await press('2026-02-10', 'ArrowDown');
		expect(focusedKey()).toBe('2026-02-10');
		expect(el.component.viewMonth).toBe(1);
	});

	it('keeps exactly one tab stop, on the cell that was navigated to', async () => {
		await mount({ value: '2026-02-28' });
		await press('2026-02-28', 'ArrowRight');

		const stops = Array.from(el.shadowRoot.querySelectorAll('.ml-calendar__grid button[tabindex="0"]')) as HTMLElement[];
		expect(stops.map((s) => s.dataset.key)).toEqual(['2026-03-01']);
	});

	it('still navigates to a value set by property or attribute', async () => {
		await mount({ value: '2026-02-11' });

		el.value = '2030-07-04';
		await flush();
		expect(el.component.viewYear).toBe(2030);
		expect(el.component.viewMonth).toBe(6);

		el.setAttribute('value', '2031-01-15');
		await flush();
		expect(el.component.viewYear).toBe(2031);
		expect(el.component.viewMonth).toBe(0);
	});
});
