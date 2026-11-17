import { devWarn } from '../../devtools/dev-mode';

const globalStylesAttribute: string = 'melodic-styles';
const globalStyleSelector: string = `style[${globalStylesAttribute}], link[rel="stylesheet"][${globalStylesAttribute}]`;

const cachedCssSheets: CSSStyleSheet[] = [];
// The CSS text behind each cached sheet, in the same order. A constructed
// sheet cannot follow an element into another document, so a component adopted
// elsewhere rebuilds its styles from the text (see ComponentBase.adoptedCallback).
const cachedCssTexts: string[] = [];
let loadingPromise: Promise<void> | null = null;
// True once the load started by `applyGlobalStyles` has settled.
let loadSettled = false;
// Roots that asked for global styles WHILE the first load was in flight, so
// they adopt the sheets when it finishes. Strong references, so a root may
// only sit here until that load settles.
const pendingRoots = new Set<ShadowRoot>();

export const applyGlobalStyles = (root: ShadowRoot): void => {
	if (hasCachedSheets()) {
		applyAdoptedSheets(root);
		return;
	}

	if (loadingPromise && loadSettled) {
		// The load finished and found nothing to adopt. Parking the root in
		// `pendingRoots` here — as this used to — retained it forever, because
		// nothing drains that set after the load: in an app with no
		// `melodic-styles` stylesheet every component ever created stayed
		// reachable, with its DOM, for the life of the page. Remember it
		// weakly instead so `refreshGlobalStyles()` can still reach it.
		rememberRoot(root);
		return;
	}

	pendingRoots.add(root);

	if (!loadingPromise) {
		loadSettled = false;
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
				loadSettled = true;
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
	cachedCssTexts.length = 0;
	loadingPromise = null;
	loadSettled = false;
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
// Roots already in `adoptedRoots`, so a root is registered once however often
// it adopts.
const rememberedRoots = new WeakSet<ShadowRoot>();
// Drops a root's WeakRef once the root is collected. Without it the set grew
// by one (dead) WeakRef per component instance ever created and was pruned
// only by `refreshGlobalStyles()`, which most apps never call.
const rootFinalizer: FinalizationRegistry<WeakRef<ShadowRoot>> | null =
	typeof FinalizationRegistry === 'undefined' ? null : new FinalizationRegistry((ref) => adoptedRoots.delete(ref));

const rememberRoot = (root: ShadowRoot): void => {
	if (rememberedRoots.has(root)) {
		return;
	}

	rememberedRoots.add(root);
	const ref = new WeakRef(root);
	adoptedRoots.add(ref);
	rootFinalizer?.register(root, ref);
};

/** The global sheets loaded so far (shared, owned by this document). Internal. */
export const getGlobalStyleSheets = (): readonly CSSStyleSheet[] => cachedCssSheets;

/** The CSS text of every global sheet loaded so far. Internal. */
export const getGlobalStyleTexts = (): readonly string[] => cachedCssTexts;

/** Internal bookkeeping sizes, exposed for the leak regression tests. */
export const globalStyleBookkeeping = (): { pendingRoots: number; rememberedRoots: number } => ({
	pendingRoots: pendingRoots.size,
	rememberedRoots: adoptedRoots.size
});

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
	rememberRoot(root);

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
		cachedCssTexts.push(trimmedText);
	}
};

const hasCachedSheets = (): boolean => {
	return cachedCssSheets.length > 0;
};
