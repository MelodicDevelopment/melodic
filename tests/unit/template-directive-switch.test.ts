import { describe, it, expect, beforeEach } from 'vitest';
import { html, render } from '../../src/template';
import { when } from '../../src/template/directives/builtin/when.directive';
import { repeat } from '../../src/template/directives/builtin/repeat.directive';
import { unsafeHTML } from '../../src/template/directives/builtin/unsafe-html.directive';
import { directive } from '../../src/template/directives/functions/directive.function';

describe('directive type switching on a single binding', () => {
	let container: HTMLElement;

	beforeEach(() => {
		container = document.createElement('div');
	});

	it('switches repeat() → when() without passing repeat state to when', () => {
		const template = (useRepeat: boolean) =>
			html`<div>
				${useRepeat
					? repeat(
							[1, 2, 3],
							(i) => i,
							(i) => html`<li>${i}</li>`
						)
					: when(true, () => html`<em>fallback</em>`)}
			</div>`;

		render(template(true), container);
		expect(container.querySelectorAll('li').length).toBe(3);

		// Switching directive type must not crash and must fully replace content.
		render(template(false), container);
		expect(container.querySelectorAll('li').length).toBe(0);
		expect(container.querySelector('em')?.textContent).toBe('fallback');

		// And back again.
		render(template(true), container);
		expect(container.querySelector('em')).toBeNull();
		expect(container.querySelectorAll('li').length).toBe(3);
	});

	it('switches when() → unsafeHTML() cleanly', () => {
		const template = (useWhen: boolean) =>
			html`<div>${useWhen ? when(true, () => html`<span>safe</span>`) : unsafeHTML('<b>raw</b>')}</div>`;

		render(template(true), container);
		expect(container.querySelector('span')?.textContent).toBe('safe');

		render(template(false), container);
		expect(container.querySelector('span')).toBeNull();
		expect(container.querySelector('b')?.textContent).toBe('raw');
	});

	it('disposes the outgoing directive state (cleanup runs on type switch)', () => {
		let disposed = 0;

		const disposableDirective = () =>
			directive((node: Node, previousState?: { __dispose: () => void }) => {
				if (previousState) return previousState;
				void node;
				return {
					__dispose: () => {
						disposed += 1;
					}
				};
			}, 'test-disposable');

		const template = (useDisposable: boolean) =>
			html`<div>${useDisposable ? disposableDirective() : when(true, () => html`<i>w</i>`)}</div>`;

		render(template(true), container);
		expect(disposed).toBe(0);

		render(template(false), container);
		expect(disposed).toBe(1);
		expect(container.querySelector('i')?.textContent).toBe('w');
	});

	it('untyped custom directives keep receiving their own state across renders', () => {
		const states: unknown[] = [];

		const counterDirective = () =>
			directive((node: Node, previousState?: { count: number }) => {
				void node;
				const state = previousState ?? { count: 0 };
				state.count += 1;
				states.push(state);
				return state;
			});

		const template = () => html`<div>${counterDirective()}</div>`;

		render(template(), container);
		render(template(), container);

		expect(states.length).toBe(2);
		// Same state object threaded through (back-compat for untyped directives).
		expect(states[0]).toBe(states[1]);
		expect((states[1] as { count: number }).count).toBe(2);
	});
});
