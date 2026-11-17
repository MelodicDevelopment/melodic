import { describe, it, expect, afterEach, beforeAll, vi } from 'vitest';
import '../../../src/components/forms/date-picker/date-picker.component';
import {
	flush,
	createComponent,
	removeComponent,
	shadowQuery,
	captureEvent
} from '../../helpers/component-test-utils';
import { installPopoverPolyfill } from '../../helpers/popover-polyfill';

describe('ml-date-picker', () => {
	let el: any;

	beforeAll(() => {
		installPopoverPolyfill();
	});

	afterEach(() => {
		if (el) removeComponent(el);
	});

	function input(): HTMLInputElement {
		return shadowQuery<HTMLInputElement>(el, '.ml-date-picker__input')!;
	}

	function changeInput(text: string): void {
		const inputEl = input();
		inputEl.value = text;
		inputEl.dispatchEvent(new Event('change', { bubbles: true }));
	}

	describe('text input with parse/format', () => {
		it('renders a text input (no native date picker competing with the calendar)', () => {
			el = createComponent('ml-date-picker');
			expect(input().type).toBe('text');
		});

		it('formats an ISO value for display as MM/DD/YYYY', async () => {
			el = createComponent('ml-date-picker', { attributes: { value: '2026-02-08' } });
			await flush();
			expect(input().value).toBe('02/08/2026');
		});

		it('parses MM/DD/YYYY input, commits ISO, and emits ml:change with the ISO value', async () => {
			el = createComponent('ml-date-picker');
			await flush();

			const eventPromise = captureEvent<{ value: string }>(el, 'ml:change');
			changeInput('03/15/2026');
			const event = await eventPromise;

			expect(event.detail.value).toBe('2026-03-15');
			expect(el.value).toBe('2026-03-15');
			await flush();
			expect(input().value).toBe('03/15/2026');
		});

		it('round-trips: format(parse(text)) is stable', async () => {
			el = createComponent('ml-date-picker');
			await flush();

			changeInput('1/5/2026');
			await flush();
			expect(el.value).toBe('2026-01-05');
			expect(input().value).toBe('01/05/2026');

			changeInput('2026-11-30');
			await flush();
			expect(el.value).toBe('2026-11-30');
			expect(input().value).toBe('11/30/2026');
		});

		it('reverts invalid input to the last committed value without emitting', async () => {
			el = createComponent('ml-date-picker', { attributes: { value: '2026-02-08' } });
			await flush();

			let fired = false;
			el.addEventListener('ml:change', () => { fired = true; });

			changeInput('not a date');
			await flush();
			expect(fired).toBe(false);
			expect(el.value).toBe('2026-02-08');
			expect(input().value).toBe('02/08/2026');

			changeInput('13/45/2026'); // impossible month/day
			await flush();
			expect(fired).toBe(false);
			expect(el.value).toBe('2026-02-08');
		});

		it('clearing the input commits an empty value', async () => {
			el = createComponent('ml-date-picker', { attributes: { value: '2026-02-08' } });
			await flush();

			const eventPromise = captureEvent<{ value: string }>(el, 'ml:change');
			changeInput('');
			const event = await eventPromise;
			expect(event.detail.value).toBe('');
			expect(el.value).toBe('');
		});
	});

	// Regression: whatever the field displays must parse back. Locales whose
	// short date is not N<sep>N<sep>N with a single / . or - (spaces after the
	// dots, a trailing literal, non-ASCII digits) reverted on every edit.
	describe('locale round-trip', () => {
		const locales = ['en-US', 'en-GB', 'de-DE', 'ko-KR', 'hu-HU', 'bg', 'ar-EG', 'ja-JP', 'fa-IR-u-ca-gregory'];

		it.each(locales)('re-committing the displayed text keeps the value (%s)', async (locale) => {
			el = createComponent('ml-date-picker', { attributes: { locale, value: '2001-02-03' } });
			await flush();

			const shown = input().value;
			expect(shown).not.toBe('');

			el.value = '';
			await flush();
			changeInput(shown);
			await flush();
			expect(el.value).toBe('2001-02-03');
		});

		it('reads day/month order from the locale', async () => {
			el = createComponent('ml-date-picker', { attributes: { locale: 'en-GB' } });
			await flush();
			changeInput('03/02/2001');
			await flush();
			expect(el.value).toBe('2001-02-03');
		});

		it('still rejects text that is not a date', async () => {
			el = createComponent('ml-date-picker', { attributes: { locale: 'en-US', value: '2026-02-08' } });
			await flush();
			for (const junk of ['tomorrow', '03/15', '03/15/2026 extra', '13/45/2026', '1/2/3/4']) {
				changeInput(junk);
				await flush();
				expect(el.value).toBe('2026-02-08');
			}
		});

		it('falls back to the browser locale for a malformed locale tag instead of throwing', async () => {
			el = createComponent('ml-date-picker', { attributes: { locale: 'not a locale!', value: '2026-02-08' } });
			await flush();
			expect(input().value).toMatch(/2026/);
		});
	});

	describe('focus behavior on close', () => {
		it('restores focus to the input on Escape (keyboard dismissal)', async () => {
			el = createComponent('ml-date-picker');
			await flush();

			const popover = shadowQuery<HTMLElement>(el, '.ml-date-picker__popover')!;
			popover.showPopover();
			await flush();
			expect(el.isOpen).toBe(true);

			const focusSpy = vi.spyOn(input(), 'focus');
			input().dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
			await flush();

			expect(el.isOpen).toBe(false);
			expect(focusSpy).toHaveBeenCalled();
		});

		it('does NOT steal focus back on pointer light-dismiss', async () => {
			el = createComponent('ml-date-picker');
			await flush();

			const popover = shadowQuery<HTMLElement>(el, '.ml-date-picker__popover')!;
			popover.showPopover();
			await flush();
			expect(el.isOpen).toBe(true);

			const focusSpy = vi.spyOn(input(), 'focus');
			// Light dismiss: the popover closes without going through the
			// component's keyboard/selection paths.
			popover.hidePopover();
			await flush();

			expect(el.isOpen).toBe(false);
			expect(focusSpy).not.toHaveBeenCalled();
		});

		it('restores focus after selecting a date inside the calendar', async () => {
			el = createComponent('ml-date-picker');
			await flush();

			const popover = shadowQuery<HTMLElement>(el, '.ml-date-picker__popover')!;
			popover.showPopover();
			await flush();

			const focusSpy = vi.spyOn(input(), 'focus');
			const calendar = shadowQuery<HTMLElement>(el, 'ml-calendar')!;
			calendar.dispatchEvent(new CustomEvent('ml:select', { bubbles: true, detail: { value: '2026-04-01' } }));
			await flush();

			expect(el.isOpen).toBe(false);
			expect(el.value).toBe('2026-04-01');
			expect(focusSpy).toHaveBeenCalled();
		});
	});
});
