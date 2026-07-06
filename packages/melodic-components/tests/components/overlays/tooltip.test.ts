import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '../../../src/components/overlays/tooltip/index';
import { flush } from '../../helpers/component-test-utils';

describe('ml-tooltip', () => {
	let host: HTMLElement;
	let trigger: HTMLButtonElement;
	let wrapper: HTMLElement;
	let content: HTMLElement;

	beforeEach(async () => {
		vi.useFakeTimers();
		host = document.createElement('ml-tooltip');
		host.setAttribute('content', 'Helpful text');
		host.innerHTML = '<button>Hover me</button>';
		document.body.appendChild(host);
		await vi.advanceTimersByTimeAsync(0);

		trigger = host.querySelector('button') as HTMLButtonElement;
		wrapper = host.shadowRoot?.querySelector('.ml-tooltip__trigger') as HTMLElement;
		content = host.shadowRoot?.querySelector('.ml-tooltip__content') as HTMLElement;
	});

	afterEach(() => {
		document.body.innerHTML = '';
		vi.useRealTimers();
	});

	async function showTooltip(): Promise<void> {
		wrapper.dispatchEvent(new Event('mouseenter'));
		await vi.advanceTimersByTimeAsync(250);
	}

	describe('aria wiring', () => {
		it('gives the tooltip content role="tooltip" and an id', () => {
			expect(content.getAttribute('role')).toBe('tooltip');
			expect(content.id).not.toBe('');
		});

		it("points the slotted trigger's aria-describedby at the tooltip content id", () => {
			expect(trigger.getAttribute('aria-describedby')).toBe(content.id);
		});

		it('does not overwrite an existing aria-describedby on the trigger', async () => {
			document.body.innerHTML = '';
			const custom = document.createElement('ml-tooltip');
			custom.setAttribute('content', 'text');
			custom.innerHTML = '<button aria-describedby="mine">T</button>';
			document.body.appendChild(custom);
			await vi.advanceTimersByTimeAsync(0);

			const btn = custom.querySelector('button') as HTMLButtonElement;
			expect(btn.getAttribute('aria-describedby')).toBe('mine');
		});
	});

	describe('show/hide behavior', () => {
		it('shows after the delay on mouseenter', async () => {
			await showTooltip();
			expect(content.classList.contains('ml-tooltip__content--visible')).toBe(true);
			expect(content.getAttribute('aria-hidden')).toBe('false');
		});

		it('shows on focusin (keyboard focus on slotted light-DOM content)', async () => {
			wrapper.dispatchEvent(new Event('focusin'));
			await vi.advanceTimersByTimeAsync(250);

			expect(content.classList.contains('ml-tooltip__content--visible')).toBe(true);
		});

		it('hides on focusout', async () => {
			await showTooltip();

			wrapper.dispatchEvent(new Event('focusout'));
			await vi.advanceTimersByTimeAsync(150);

			expect(content.classList.contains('ml-tooltip__content--visible')).toBe(false);
		});

		it('dismisses immediately on Escape while visible (WCAG 1.4.13)', async () => {
			await showTooltip();
			expect(content.classList.contains('ml-tooltip__content--visible')).toBe(true);

			document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
			await vi.advanceTimersByTimeAsync(0);

			expect(content.classList.contains('ml-tooltip__content--visible')).toBe(false);
		});

		it('ignores Escape when not visible', async () => {
			expect(() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))).not.toThrow();
			expect(content.classList.contains('ml-tooltip__content--visible')).toBe(false);
		});
	});

	describe('positioning', () => {
		it('starts autoUpdate while visible (repositions on window scroll) and stops on hide', async () => {
			await showTooltip();

			content.style.left = '';
			window.dispatchEvent(new Event('scroll'));
			// autoUpdate re-ran updatePosition, which re-sets left/top.
			expect(content.style.left).not.toBe('');

			wrapper.dispatchEvent(new Event('mouseleave'));
			await vi.advanceTimersByTimeAsync(150);

			content.style.left = '';
			window.dispatchEvent(new Event('scroll'));
			expect(content.style.left).toBe('');
		});
	});
});
