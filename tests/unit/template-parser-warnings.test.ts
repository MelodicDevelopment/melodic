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
