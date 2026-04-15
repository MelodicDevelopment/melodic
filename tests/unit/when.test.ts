import { describe, it, expect, beforeEach } from 'vitest';
import { html, render } from '../../src/template';
import { when } from '../../src/template/directives/builtin/when.directive';

describe('when directive', () => {
	let container: HTMLElement;

	beforeEach(() => {
		container = document.createElement('div');
	});

	it('does not invoke the true template when condition is false on first render', () => {
		let trueCalls = 0;
		let falseCalls = 0;

		render(
			html`<div>${when(
				false,
				() => {
					trueCalls++;
					return html`<span>true</span>`;
				},
				() => {
					falseCalls++;
					return html`<span>false</span>`;
				}
			)}</div>`,
			container
		);

		expect(trueCalls).toBe(0);
		expect(falseCalls).toBe(1);
		expect(container.textContent).toContain('false');
	});

	it('does not invoke the false template when condition is true on first render', () => {
		let trueCalls = 0;
		let falseCalls = 0;

		render(
			html`<div>${when(
				true,
				() => {
					trueCalls++;
					return html`<span>true</span>`;
				},
				() => {
					falseCalls++;
					return html`<span>false</span>`;
				}
			)}</div>`,
			container
		);

		expect(trueCalls).toBe(1);
		expect(falseCalls).toBe(0);
		expect(container.textContent).toContain('true');
	});

	it('safely supports the null-guard pattern', () => {
		let value: { prop: string } | null = null;

		const renderWith = (v: typeof value) => {
			value = v;
			render(
				html`<div>${when(!!value, () => {
					const safe = value!;
					return html`<span>${safe.prop}</span>`;
				})}</div>`,
				container
			);
		};

		expect(() => renderWith(null)).not.toThrow();
		expect(container.textContent?.trim()).toBe('');

		renderWith({ prop: 'hello' });
		expect(container.textContent).toContain('hello');

		renderWith(null);
		expect(container.textContent).not.toContain('hello');
	});

	it('only invokes the branch that will render on condition flips', () => {
		let trueCalls = 0;
		let falseCalls = 0;

		const doRender = (cond: boolean) => {
			render(
				html`<div>${when(
					cond,
					() => {
						trueCalls++;
						return html`<span>t</span>`;
					},
					() => {
						falseCalls++;
						return html`<span>f</span>`;
					}
				)}</div>`,
				container
			);
		};

		doRender(false);
		expect(trueCalls).toBe(0);
		expect(falseCalls).toBe(1);

		doRender(true);
		expect(trueCalls).toBe(1);
		expect(falseCalls).toBe(1);

		doRender(false);
		expect(trueCalls).toBe(1);
		expect(falseCalls).toBe(2);
	});

	it('omitting falseTemplate when condition is false renders nothing', () => {
		let trueCalls = 0;

		render(
			html`<div>${when(false, () => {
				trueCalls++;
				return html`<span>true</span>`;
			})}</div>`,
			container
		);

		expect(trueCalls).toBe(0);
		expect(container.textContent?.trim()).toBe('');
	});
});
