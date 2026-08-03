import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { html, render } from '../../src/template';

describe('template parser dev diagnostics (unsupported binding positions)', () => {
	let container: HTMLElement;
	let warnSpy: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		container = document.createElement('div');
		warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
	});

	afterEach(() => {
		warnSpy.mockRestore();
	});

	const unsupportedWarnings = (text: string) =>
		warnSpy.mock.calls.filter((call) => String(call[0]).includes('unsupported position') && String(call[0]).includes(text));

	it('warns for a binding inside <textarea> content and does not throw', () => {
		expect(() => render(html`<textarea>${'seed value'}</textarea>`, container)).not.toThrow();
		expect(unsupportedWarnings('textarea').length).toBe(1);
	});

	it('warns for a binding inside <title> content', () => {
		render(html`<title>${'Page Title'}</title>`, container);
		expect(unsupportedWarnings('title').length).toBe(1);
	});

	it('warns for a binding inside an HTML comment', () => {
		render(html`<div><!-- note: ${'hidden'} --></div>`, container);
		expect(unsupportedWarnings('HTML comment').length).toBe(1);
	});

	it('warns for a binding in tag-name position', () => {
		render(html`<${'div'}>content</div>`, container);
		expect(unsupportedWarnings('tag-name').length).toBe(1);
	});

	it('includes an identifying snippet of the offending template', () => {
		render(html`<textarea id="offender-snippet">${'x'}</textarea>`, container);
		const [message] = unsupportedWarnings('textarea')[0];
		expect(String(message)).toContain('offender-snippet');
	});

	it('warns once per template, not once per render', () => {
		const view = (value: string) => html`<textarea class="warn-once">${value}</textarea>`;
		render(view('a'), container);
		render(view('b'), container);
		expect(unsupportedWarnings('textarea').length).toBe(1);
	});

	it('does not warn for bindings in supported positions', () => {
		render(html`<div title=${'tip'} ?hidden=${false} @click=${() => {}}>${'text'}</div>`, container);
		expect(warnSpy.mock.calls.filter((call) => String(call[0]).includes('unsupported position')).length).toBe(0);
	});
});

describe('template parser dev diagnostics (leaked part markers)', () => {
	let container: HTMLElement;
	let warnSpy: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		container = document.createElement('div');
		warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
	});

	afterEach(() => {
		warnSpy.mockRestore();
	});

	const leakWarnings = () => warnSpy.mock.calls.filter((call) => String(call[0]).includes('part marker leaked'));

	it('warns when an unbalanced quote swallows following markup, and does not throw', () => {
		// The missing closing quote makes the parser scan to the next quote in the
		// template, consuming the child elements into the title attribute value.
		expect(() =>
			render(html`<div class="clock" title="${'label'}><span>${'a'}</span><span>${'b'}</span></div>`, container)
		).not.toThrow();
		expect(leakWarnings().length).toBe(1);
	});

	it('names the value indices that were lost', () => {
		render(html`<div title="${'x'}><em>${'lost'}</em></div>`, container);
		expect(String(leakWarnings()[0][0])).toMatch(/value index .*1/);
	});

	it('includes an identifying snippet of the offending template', () => {
		render(html`<div id="leak-snippet" title="${'x'}><em>${'y'}</em></div>`, container);
		expect(String(leakWarnings()[0][0])).toContain('leak-snippet');
	});

	it('warns once per template, not once per render', () => {
		const view = (value: string) => html`<div class="leak-once" title="${value}><em>${value}</em></div>`;
		render(view('a'), container);
		render(view('b'), container);
		expect(leakWarnings().length).toBe(1);
	});

	it('does not double-report a template already flagged for an unsupported position', () => {
		render(html`<textarea>${'seed'}</textarea>`, container);
		expect(leakWarnings().length).toBe(0);
	});

	it.each([
		['unquoted attribute value', () => html`<div title=${'x'}>hi</div>`],
		['single-quoted attribute', () => html`<div title='${'x'}'>hi</div>`],
		['apostrophe inside a double-quoted value', () => html`<div title="it's ${'x'}">hi</div>`],
		['double quote inside a single-quoted value', () => html`<div title='say "${'x'}"'>hi</div>`],
		['svg content', () => html`<svg viewBox="0 0 10 10"><circle r=${'4'} /></svg>`],
		['self-closing custom element', () => html`<my-el .value=${'v'} />`],
		['multiple composite attributes', () => html`<div class="a ${'b'} c" style="top:${'1px'};left:${'2px'}">x</div>`],
		['adjacent text bindings', () => html`<p>${'a'}${'b'} ${'c'}</p>`],
		['repeated sibling bindings', () => html`<ul><li id=${'1'}>${'a'}</li><li id=${'2'}>${'b'}</li></ul>`],
		['attribute value containing a > character', () => html`<div data-q="a>b ${'x'}">hi</div>`],
		['table markup', () => html`<table><tbody><tr><td>${'cell'}</td></tr></tbody></table>`],
		['empty string bindings', () => html`<div title="${''}">${''}</div>`]
	])('does not warn for %s', (name, build) => {
		render(build(), container);
		expect(leakWarnings().length).toBe(0);
	});

	it('does not warn for well-formed templates, including composite and static-action bindings', () => {
		render(
			html`<div
				class="a ${'b'} c ${'d'}"
				title=${'tip'}
				:ref=${'static'}
				?hidden=${false}
				.value=${'v'}
				@click=${() => {}}
			>
				${'text'}
			</div>`,
			container
		);
		expect(leakWarnings().length).toBe(0);
	});
});
