import { devWarn } from '../../devtools/dev-mode';

const globalStylesAttribute: string = 'melodic-styles';
const globalStyleSelector: string = `style[${globalStylesAttribute}], link[rel="stylesheet"][${globalStylesAttribute}]`;

const cachedCssSheets: CSSStyleSheet[] = [];
let loadingPromise: Promise<void> | null = null;
// Roots that asked for global styles before the first load finished, so a
// second pass can adopt sheets that arrive later (a stylesheet added after the
// first component was constructed used to be adopted by nothing).
const pendingRoots = new Set<ShadowRoot>();

export const applyGlobalStyles = (root: ShadowRoot): void => {
	if (hasCachedSheets()) {
		applyAdoptedSheets(root);
		return;
	}

	pendingRoots.add(root);

	if (!loadingPromise) {
		loadingPromise = loadStyles()
			.catch((error) => {
				// A cross-origin <link> throws on `cssRules`. Without this catch
				// the rejection was stored in `loadingPromise` and every later
				// component constructor attached another `.then()` to it,
				// producing one unhandled rejection per component.
				devWarn(
					'global-styles-load',
					'Global styles could not be read. A cross-origin stylesheet cannot be adopted into shadow roots — ' +
						'serve it same-origin or inline it in a <style melodic-styles> element.',
					error
				);
			})
			.finally(() => {
				for (const pending of pendingRoots) {
					applyAdoptedSheets(pending);
				}
				pendingRoots.clear();
			});
	}
};

/**
 * Re-read the `melodic-styles` elements and adopt anything new into every
 * shadow root created so far. Call after adding a global stylesheet at runtime.
 */
export const refreshGlobalStyles = async (): Promise<void> => {
	cachedCssSheets.length = 0;
	loadingPromise = null;
	await loadStyles().catch(() => undefined);

	for (const ref of [...adoptedRoots]) {
		const root = ref.deref();
		if (root) {
			applyAdoptedSheets(root);
		} else {
			adoptedRoots.delete(ref);
		}
	}
};

/**
 * Every root that has adopted the global sheets, so a refresh can reach them.
 * Weak so a destroyed component's shadow root is not retained by the style
 * system for the life of the page.
 */
const adoptedRoots = new Set<WeakRef<ShadowRoot>>();

const loadStyles = async (): Promise<void> => {
	const globalStyleElements = document.querySelectorAll(globalStyleSelector);

	if (globalStyleElements.length === 0) {
		return;
	}

	for (const element of globalStyleElements) {
		if (element instanceof HTMLStyleElement) {
			cacheCssSheet(element.textContent ?? '');
			continue;
		}

		if (element instanceof HTMLLinkElement) {
			if (!element.sheet) {
				await new Promise<void>((resolve) => {
					element.addEventListener('load', () => resolve(), { once: true });
					element.addEventListener('error', () => resolve(), { once: true });
				});
			}

			try {
				cacheCssSheet(
					Array.from(element.sheet?.cssRules ?? [])
						.map((rule) => rule.cssText)
						.join('\n')
				);
			} catch (error) {
				// Cross-origin sheet: `cssRules` throws a SecurityError. Skip it
				// and keep loading the rest instead of failing every component.
				devWarn(
					`global-styles-cors:${element.href}`,
					`Global stylesheet "${element.href}" is cross-origin, so its rules cannot be copied into shadow roots. ` +
						'Serve it from the same origin to have it adopted.',
					error
				);
			}
		}
	}
};

const applyAdoptedSheets = (root: ShadowRoot): void => {
	adoptedRoots.add(new WeakRef(root));

	const adopted = root.adoptedStyleSheets ?? [];
	const newSheets = cachedCssSheets.filter((sheet) => !adopted.includes(sheet));

	if (newSheets.length > 0) {
		root.adoptedStyleSheets = [...adopted, ...newSheets];
	}
};

const cacheCssSheet = (text: string): void => {
	const trimmedText = text.trim();
	if (trimmedText.length > 0) {
		const sheet = new CSSStyleSheet();
		sheet.replaceSync(trimmedText);
		cachedCssSheets.push(sheet);
	}
};

const hasCachedSheets = (): boolean => {
	return cachedCssSheets.length > 0;
};
