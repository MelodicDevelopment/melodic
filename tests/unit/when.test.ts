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

	it('updates the DOM when the true branch returns a structurally different template', () => {
		const template = (flag: boolean) =>
			html`<div>${when(true, () => (flag ? html`<strong>bold</strong>` : html`<em>italic</em>`))}</div>`;

		render(template(true), container);
		expect(container.querySelector('strong')?.textContent).toBe('bold');
		expect(container.querySelector('em')).toBeNull();

		// Condition stays true, but the branch template's STRUCTURE changes —
		// the old structure must be replaced, not silently kept.
		render(template(false), container);
		expect(container.querySelector('strong')).toBeNull();
		expect(container.querySelector('em')?.textContent).toBe('italic');

		render(template(true), container);
		expect(container.querySelector('strong')?.textContent).toBe('bold');
		expect(container.querySelector('em')).toBeNull();
	});

	it('updates the DOM when the false branch returns a structurally different template', () => {
		const template = (flag: boolean) =>
			html`<div>${when(
				false,
				() => html`<span>never</span>`,
				() => (flag ? html`<strong>f-bold</strong>` : html`<em>f-italic</em>`)
			)}</div>`;

		render(template(true), container);
		expect(container.querySelector('strong')?.textContent).toBe('f-bold');

		render(template(false), container);
		expect(container.querySelector('strong')).toBeNull();
		expect(container.querySelector('em')?.textContent).toBe('f-italic');
	});

	it('still updates values in place when the branch structure is unchanged', () => {
		const template = (label: string) => html`<div>${when(true, () => html`<span>${label}</span>`)}</div>`;

		render(template('one'), container);
		const span = container.querySelector('span');
		expect(span?.textContent).toBe('one');

		render(template('two'), container);
		// Same structure — the SAME element is updated, not recreated.
		expect(container.querySelector('span')).toBe(span);
		expect(span?.textContent).toBe('two');
	});
});
