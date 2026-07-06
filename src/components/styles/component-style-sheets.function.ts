import type { TemplateResult } from '../../template/classes/template-result.class';
import { render } from '../../template/functions/render.function';
import { disposeContainerParts } from '../../template/functions/dispose.functions';

/**
 * Shared constructed stylesheets for component styles.
 *
 * Instead of every component instance carrying its own `<style>` element, one
 * CSSStyleSheet is built per component class (keyed by the styles factory and
 * deduped by the produced CSS text) and adopted by each instance's shadow root
 * via `adoptedStyleSheets`. Environments without constructed-stylesheet
 * support fall back to the per-instance `<style>` element path in
 * ComponentBase.
 */

// CSS text produced by a component class's styles factory. The factory is a
// per-class static, so its output is rendered once and reused by every instance.
const cssTextCache = new WeakMap<() => TemplateResult, string>();

// Constructed sheets keyed by CSS text (identical styles share one sheet).
// A `null` entry records a construction failure so the fallback path is taken
// without retrying per instance.
const sheetCache = new Map<string, CSSStyleSheet | null>();

let constructedSheetsSupported: boolean | undefined;

/** Feature-detect constructed stylesheets (constructor + replaceSync + adoptedStyleSheets). */
export function supportsConstructedStyleSheets(): boolean {
	if (constructedSheetsSupported === undefined) {
		try {
			constructedSheetsSupported =
				typeof CSSStyleSheet !== 'undefined' &&
				typeof CSSStyleSheet.prototype.replaceSync === 'function' &&
				typeof ShadowRoot !== 'undefined' &&
				'adoptedStyleSheets' in ShadowRoot.prototype &&
				// Engines can expose the class but throw on direct construction.
				new CSSStyleSheet() instanceof CSSStyleSheet;
		} catch {
			constructedSheetsSupported = false;
		}
	}

	return constructedSheetsSupported;
}

/**
 * Get (or build) the shared CSSStyleSheet for a component's styles factory.
 * Returns null when constructed stylesheets are unavailable or sheet
 * construction fails — callers should fall back to a `<style>` element.
 */
export function getComponentStyleSheet(stylesFactory: () => TemplateResult): CSSStyleSheet | null {
	if (!supportsConstructedStyleSheets()) {
		return null;
	}

	let cssText = cssTextCache.get(stylesFactory);
	if (cssText === undefined) {
		cssText = renderStylesToText(stylesFactory());
		cssTextCache.set(stylesFactory, cssText);
	}

	let sheet = sheetCache.get(cssText);
	if (sheet === undefined) {
		try {
			const created = new CSSStyleSheet();
			created.replaceSync(cssText);
			sheet = created;
		} catch {
			sheet = null;
		}
		sheetCache.set(cssText, sheet);
	}

	return sheet;
}

/** Render a styles TemplateResult to plain CSS text (once per component class). */
function renderStylesToText(result: TemplateResult): string {
	const host = document.createElement('style');
	render(result, host);
	const text = host.textContent ?? '';
	// The temp host is discarded — release any part tree the render created.
	disposeContainerParts(host);
	return text;
}
