import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { html, render, when } from '@melodicdev/core/template';
// Importing the directive registers `:tooltip` and the ml-tooltip element.
import { tooltipDirective } from '../../src/directives/tooltip.directive';
import { flush } from '../helpers/component-test-utils';

describe(':tooltip directive', () => {
	let container: HTMLElement;

	beforeEach(() => {
		container = document.createElement('div');
		document.body.appendChild(container);
	});

	afterEach(() => {
		document.body.innerHTML = '';
		vi.useRealTimers();
	});

	const view = (tip: string) => html`
		<div class="wrap">
			<button :tooltip=${tip}>Hover me</button>
		</div>
	`;

	describe('no reparenting', () => {
		it('keeps the host element in its original container and adds an ml-tooltip sibling', async () => {
			render(view('Helpful tip'), container);
			await flush();

			const wrap = container.querySelector('.wrap') as HTMLElement;
			const button = container.querySelector('button') as HTMLButtonElement;

			// Host stays put — NOT moved inside the tooltip.
			expect(button.parentElement).toBe(wrap);

			const tooltip = wrap.querySelector('ml-tooltip') as HTMLElement;
			expect(tooltip).not.toBeNull();
			expect(tooltip.contains(button)).toBe(false);
			expect(button.nextElementSibling).toBe(tooltip);
			expect(tooltip.getAttribute('content')).toBe('Helpful tip');
		});

		it('wires the host element aria-describedby to the tooltip content', async () => {
			render(view('Tip'), container);
			await flush();

			const button = container.querySelector('button') as HTMLButtonElement;
			const describedBy = button.getAttribute('aria-describedby');
			expect(describedBy).toBeTruthy();

			const content = container.querySelector('ml-tooltip')?.shadowRoot?.querySelector('.ml-tooltip__content');
			expect(content?.id).toBe(describedBy);
		});
	});

	describe('dynamic content updates', () => {
		it('propagates a new value on re-render, reusing the same ml-tooltip', async () => {
			render(view('First'), container);
			await flush();
			const tooltip = container.querySelector('ml-tooltip') as HTMLElement;
			expect(tooltip.getAttribute('content')).toBe('First');

			render(view('Second'), container);
			await flush();
			await flush();

			const tooltips = container.querySelectorAll('ml-tooltip');
			expect(tooltips.length).toBe(1);
			expect(tooltips[0]).toBe(tooltip); // adopted in place, not recreated
			expect(tooltip.getAttribute('content')).toBe('Second');
			// Host still untouched after the update.
			expect(container.querySelector('button')?.parentElement).toBe(container.querySelector('.wrap'));
		});

		it('updates placement from the object form', async () => {
			const objectView = (placement: string) => html`
				<button :tooltip=${{ content: 'Info', placement }}>Info</button>
			`;

			render(objectView('bottom'), container);
			await flush();
			const tooltip = container.querySelector('ml-tooltip') as HTMLElement;
			expect(tooltip.getAttribute('placement')).toBe('bottom');

			render(objectView('right'), container);
			await flush();
			expect(tooltip.getAttribute('placement')).toBe('right');
		});

		it('removes the tooltip when the value becomes empty', async () => {
			render(view('Tip'), container);
			await flush();
			expect(container.querySelector('ml-tooltip')).not.toBeNull();

			render(view(''), container);
			await flush();
			await flush();

			expect(document.querySelector('ml-tooltip')).toBeNull();
			// Host stays in place.
			expect(container.querySelector('button')?.parentElement).toBe(container.querySelector('.wrap'));
		});
	});

	describe('show/hide triggers', () => {
		it('shows on host hover after the delay and hides on mouseleave', async () => {
			vi.useFakeTimers();
			render(view('Tip'), container);
			await vi.advanceTimersByTimeAsync(0);

			const button = container.querySelector('button') as HTMLButtonElement;
			const content = container.querySelector('ml-tooltip')?.shadowRoot?.querySelector('.ml-tooltip__content') as HTMLElement;

			button.dispatchEvent(new Event('mouseenter'));
			await vi.advanceTimersByTimeAsync(250);
			expect(content.classList.contains('ml-tooltip__content--visible')).toBe(true);

			button.dispatchEvent(new Event('mouseleave'));
			await vi.advanceTimersByTimeAsync(150);
			expect(content.classList.contains('ml-tooltip__content--visible')).toBe(false);
		});

		it('shows on focusin and hides on focusout (keyboard access)', async () => {
			vi.useFakeTimers();
			render(view('Tip'), container);
			await vi.advanceTimersByTimeAsync(0);

			const button = container.querySelector('button') as HTMLButtonElement;
			const content = container.querySelector('ml-tooltip')?.shadowRoot?.querySelector('.ml-tooltip__content') as HTMLElement;

			button.dispatchEvent(new Event('focusin'));
			await vi.advanceTimersByTimeAsync(250);
			expect(content.classList.contains('ml-tooltip__content--visible')).toBe(true);

			button.dispatchEvent(new Event('focusout'));
			await vi.advanceTimersByTimeAsync(150);
			expect(content.classList.contains('ml-tooltip__content--visible')).toBe(false);
		});

		it('dismisses on Escape while visible (WCAG 1.4.13)', async () => {
			vi.useFakeTimers();
			render(view('Tip'), container);
			await vi.advanceTimersByTimeAsync(0);

			const button = container.querySelector('button') as HTMLButtonElement;
			const content = container.querySelector('ml-tooltip')?.shadowRoot?.querySelector('.ml-tooltip__content') as HTMLElement;

			button.dispatchEvent(new Event('mouseenter'));
			await vi.advanceTimersByTimeAsync(250);
			expect(content.classList.contains('ml-tooltip__content--visible')).toBe(true);

			document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
			await vi.advanceTimersByTimeAsync(0);
			expect(content.classList.contains('ml-tooltip__content--visible')).toBe(false);
		});
	});

	describe('cleanup', () => {
		it('removes the tooltip and aria wiring when the host is removed via a when toggle', async () => {
			const toggled = (show: boolean) => html`
				<div class="host">${when(show, () => html`<button :tooltip=${'Tip'}>B</button>`)}</div>
			`;

			render(toggled(true), container);
			await flush();
			expect(container.querySelector('ml-tooltip')).not.toBeNull();

			render(toggled(false), container);
			await flush();
			await flush();

			expect(document.querySelector('ml-tooltip')).toBeNull();
			expect(document.querySelector('button')).toBeNull();
		});

		it('recreates the tooltip when the when branch toggles back on', async () => {
			const toggled = (show: boolean) => html`
				<div class="host">${when(show, () => html`<button :tooltip=${'Tip'}>B</button>`)}</div>
			`;

			render(toggled(true), container);
			await flush();
			render(toggled(false), container);
			await flush();
			await flush();
			render(toggled(true), container);
			await flush();

			const button = container.querySelector('button') as HTMLButtonElement;
			const tooltip = container.querySelector('ml-tooltip') as HTMLElement;
			expect(tooltip).not.toBeNull();
			expect(tooltip.getAttribute('content')).toBe('Tip');
			expect(button.nextElementSibling).toBe(tooltip);
		});
	});

	describe('null-parent safety', () => {
		it('handles a detached element without throwing and inserts the tooltip on first show', async () => {
			vi.useFakeTimers();
			const el = document.createElement('button');

			// Directive applied while the element has no parentNode.
			const cleanup = tooltipDirective(el, 'Tip') as () => void;
			expect(typeof cleanup).toBe('function');
			expect(document.querySelector('ml-tooltip')).toBeNull();

			// Once connected, the first show trigger inserts the sibling tooltip.
			document.body.appendChild(el);
			el.dispatchEvent(new Event('mouseenter'));
			await vi.advanceTimersByTimeAsync(250);

			const tooltip = el.nextElementSibling as HTMLElement;
			expect(tooltip?.tagName).toBe('ML-TOOLTIP');
			const content = tooltip.shadowRoot?.querySelector('.ml-tooltip__content') as HTMLElement;
			expect(content.classList.contains('ml-tooltip__content--visible')).toBe(true);

			cleanup();
			await vi.advanceTimersByTimeAsync(0);
			expect(document.querySelector('ml-tooltip')).toBeNull();
			expect(el.hasAttribute('aria-describedby')).toBe(false);
		});

		it('is a no-op for empty values on a detached element', () => {
			const el = document.createElement('button');
			expect(() => tooltipDirective(el, '')).not.toThrow();
			expect(() => tooltipDirective(el, null)).not.toThrow();
			expect(document.querySelector('ml-tooltip')).toBeNull();
		});
	});
});
