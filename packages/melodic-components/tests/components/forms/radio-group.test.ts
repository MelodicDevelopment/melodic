import { describe, it, expect, afterEach } from 'vitest';
import '../../../src/components/forms/radio/radio.component';
import '../../../src/components/forms/radio/radio-group.component';
import { flush, createComponent, removeComponent } from '../../helpers/component-test-utils';

describe('ml-radio-group', () => {
	let el: any;

	afterEach(() => {
		if (el) removeComponent(el);
	});

	function createGroup(values: string[] = ['a', 'b', 'c'], groupAttrs: Record<string, string> = {}): {
		group: HTMLElement;
		radios: HTMLElement[];
	} {
		const group = createComponent('ml-radio-group', { attributes: { name: 'test', ...groupAttrs } });
		const radios = values.map((value) => {
			const radio = document.createElement('ml-radio');
			radio.setAttribute('value', value);
			radio.setAttribute('label', value.toUpperCase());
			group.appendChild(radio);
			return radio;
		});
		return { group, radios };
	}

	function radioInput(radio: HTMLElement): HTMLInputElement {
		return radio.shadowRoot!.querySelector('.ml-radio__input') as HTMLInputElement;
	}

	function keydown(target: HTMLElement, key: string): void {
		target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, composed: true }));
	}

	describe('single ml:change per selection', () => {
		it('emits exactly one ml:change (from the group) per radio click', async () => {
			const { group, radios } = createGroup();
			el = group;
			await flush();

			const received: CustomEvent[] = [];
			document.body.addEventListener('ml:change', (e) => received.push(e as CustomEvent), { capture: false });

			const input = radioInput(radios[1]);
			input.checked = true;
			input.dispatchEvent(new Event('change', { bubbles: true }));
			await flush();

			expect(received.length).toBe(1);
			expect(received[0].detail).toEqual({ value: 'b' });
			expect(received[0].target).toBe(group);
		});
	});

	describe('roving tabindex', () => {
		it('makes only the first enabled radio tabbable when nothing is selected', async () => {
			const { group, radios } = createGroup();
			el = group;
			await flush();
			await flush();

			expect(radioInput(radios[0]).getAttribute('tabindex')).toBe('0');
			expect(radioInput(radios[1]).getAttribute('tabindex')).toBe('-1');
			expect(radioInput(radios[2]).getAttribute('tabindex')).toBe('-1');
		});

		it('moves the tab stop to the selected radio', async () => {
			const { group, radios } = createGroup();
			el = group;
			(el as any).value = 'b';
			await flush();
			await flush();

			expect(radioInput(radios[0]).getAttribute('tabindex')).toBe('-1');
			expect(radioInput(radios[1]).getAttribute('tabindex')).toBe('0');
			expect(radioInput(radios[2]).getAttribute('tabindex')).toBe('-1');
		});

		it('ArrowDown selects and focuses the next radio', async () => {
			const { group, radios } = createGroup();
			el = group;
			(el as any).value = 'a';
			await flush();
			await flush();

			const received: CustomEvent[] = [];
			el.addEventListener('ml:change', (e: Event) => received.push(e as CustomEvent));

			keydown(radios[0], 'ArrowDown');
			await flush();

			expect((el as any).value).toBe('b');
			expect(received.length).toBe(1);
			expect(received[0].detail).toEqual({ value: 'b' });
			expect((radios[1] as any).checked).toBe(true);
			expect((radios[0] as any).checked).toBe(false);
		});

		it('ArrowUp selects the previous radio and wraps at the top', async () => {
			const { group, radios } = createGroup();
			el = group;
			(el as any).value = 'a';
			await flush();
			await flush();

			keydown(radios[0], 'ArrowUp');
			await flush();
			expect((el as any).value).toBe('c');
			expect((radios[2] as any).checked).toBe(true);
		});

		it('ArrowRight wraps from the last radio to the first', async () => {
			const { group, radios } = createGroup();
			el = group;
			(el as any).value = 'c';
			await flush();
			await flush();

			keydown(radios[2], 'ArrowRight');
			await flush();
			expect((el as any).value).toBe('a');
		});

		it('skips disabled radios during arrow navigation', async () => {
			const { group, radios } = createGroup();
			el = group;
			radios[1].setAttribute('disabled', '');
			(el as any).value = 'a';
			await flush();
			await flush();

			keydown(radios[0], 'ArrowDown');
			await flush();
			expect((el as any).value).toBe('c');
		});

		it('does nothing when the group is disabled', async () => {
			const { group, radios } = createGroup(['a', 'b', 'c'], { disabled: '' });
			el = group;
			(el as any).value = 'a';
			await flush();
			await flush();

			keydown(radios[0], 'ArrowDown');
			await flush();
			expect((el as any).value).toBe('a');
		});
	});
});
