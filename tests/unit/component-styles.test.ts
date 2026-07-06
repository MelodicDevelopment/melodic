import { describe, it, expect, vi } from 'vitest';
import { MelodicComponent } from '../../src/components/decorators/melodic-component.decorator';
import { html } from '../../src/template';
import { getComponentStyleSheet, supportsConstructedStyleSheets } from '../../src/components/styles/component-style-sheets.function';

describe('component styles (shared constructed stylesheets)', () => {
	it('detects constructed stylesheet support in the test environment', () => {
		expect(supportsConstructedStyleSheets()).toBe(true);
	});

	it('returns one shared sheet for repeated calls with the same styles factory', () => {
		const styles = () => html`:host { color: rgb(1, 2, 3); }`;

		const first = getComponentStyleSheet(styles);
		const second = getComponentStyleSheet(styles);

		expect(first).toBeInstanceOf(CSSStyleSheet);
		expect(second).toBe(first);
	});

	it('returns distinct sheets for factories producing different CSS', () => {
		const stylesA = () => html`:host { color: rgb(10, 0, 0); }`;
		const stylesB = () => html`:host { color: rgb(0, 10, 0); }`;

		expect(getComponentStyleSheet(stylesA)).not.toBe(getComponentStyleSheet(stylesB));
	});

	it('dedupes sheets by produced CSS text across different factories', () => {
		const stylesA = () => html`:host { border-width: 7px; }`;
		const stylesB = () => html`:host { border-width: 7px; }`;

		expect(getComponentStyleSheet(stylesA)).toBe(getComponentStyleSheet(stylesB));
	});

	it('shares one adopted sheet across instances of a class; distinct sheets across classes', () => {
		class StyledOne {}
		MelodicComponent({
			selector: 'test-styled-one',
			template: () => html`<span>one</span>`,
			styles: () => html`:host { padding: 11px; }`
		})(StyledOne);

		class StyledTwo {}
		MelodicComponent({
			selector: 'test-styled-two',
			template: () => html`<span>two</span>`,
			styles: () => html`:host { padding: 22px; }`
		})(StyledTwo);

		const oneA = document.createElement('test-styled-one');
		const oneB = document.createElement('test-styled-one');
		const two = document.createElement('test-styled-two');
		document.body.append(oneA, oneB, two);

		try {
			const sheetsOneA = oneA.shadowRoot!.adoptedStyleSheets;
			const sheetsOneB = oneB.shadowRoot!.adoptedStyleSheets;
			const sheetsTwo = two.shadowRoot!.adoptedStyleSheets;

			expect(sheetsOneA.length).toBe(1);
			expect(sheetsOneB.length).toBe(1);
			expect(sheetsTwo.length).toBe(1);

			// Same class → the identical CSSStyleSheet object (no per-instance parse).
			expect(sheetsOneA[0]).toBe(sheetsOneB[0]);
			// Different class → its own sheet.
			expect(sheetsTwo[0]).not.toBe(sheetsOneA[0]);

			// No per-instance <style> element on the constructed-sheets path.
			expect(oneA.shadowRoot!.querySelector('style')).toBeNull();
			expect(two.shadowRoot!.querySelector('style')).toBeNull();
		} finally {
			oneA.remove();
			oneB.remove();
			two.remove();
		}
	});

	it('falls back to a per-instance <style> element when sheet construction fails', () => {
		const replaceSpy = vi.spyOn(CSSStyleSheet.prototype, 'replaceSync').mockImplementation(() => {
			throw new Error('constructed sheets unavailable');
		});

		try {
			class StyledFallback {}
			MelodicComponent({
				selector: 'test-styled-fallback',
				template: () => html`<span>fallback</span>`,
				styles: () => html`:host { color: rgb(4, 5, 6); }`
			})(StyledFallback);

			const element = document.createElement('test-styled-fallback');
			document.body.appendChild(element);

			try {
				const styleNode = element.shadowRoot!.querySelector('style');
				expect(styleNode).not.toBeNull();
				expect(styleNode!.textContent).toContain('rgb(4, 5, 6)');
				expect(element.shadowRoot!.adoptedStyleSheets.length).toBe(0);
			} finally {
				element.remove();
			}
		} finally {
			replaceSpy.mockRestore();
		}
	});
});
