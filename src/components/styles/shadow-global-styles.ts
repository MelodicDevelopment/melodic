const GLOBAL_STYLE_SELECTOR = 'style[melodic-styles], link[melodic-styles][rel="stylesheet"]';

let cachedSheet: CSSStyleSheet | null = null;
let cachedText: string | null = null;
let loadPromise: Promise<void> | null = null;
const pendingRoots = new Set<ShadowRoot>();

const supportsConstructableStylesheets = (): boolean => {
	return 'adoptedStyleSheets' in Document.prototype && 'replaceSync' in CSSStyleSheet.prototype;
};

const applyStylesToRoot = (root: ShadowRoot): void => {
	if (cachedSheet && 'adoptedStyleSheets' in root) {
		const adopted = root.adoptedStyleSheets ?? [];
		if (!adopted.includes(cachedSheet)) {
			root.adoptedStyleSheets = [...adopted, cachedSheet];
		}
		return;
	}

	if (cachedText) {
		const styleNode = document.createElement('style');
		styleNode.textContent = cachedText;
		root.appendChild(styleNode);
	}
};

const cacheStylesFromText = (text: string): void => {
	if (text.trim().length === 0) {
		return;
	}

	if (supportsConstructableStylesheets()) {
		const sheet = new CSSStyleSheet();
		sheet.replaceSync(text);
		cachedSheet = sheet;
		return;
	}

	cachedText = text;
};

const extractCssText = (sheet: CSSStyleSheet): string | null => {
	try {
		return Array.from(sheet.cssRules)
			.map((rule) => rule.cssText)
			.join('\n');
	} catch {
		return null;
	}
};

const resolvePendingRoots = (): void => {
	if (!cachedSheet && !cachedText) {
		pendingRoots.clear();
		return;
	}

	for (const root of pendingRoots) {
		applyStylesToRoot(root);
	}
	pendingRoots.clear();
};

const loadStylesFromLink = (link: HTMLLinkElement): void => {
	if (loadPromise) {
		return;
	}

	loadPromise = (async () => {
		const attemptLoad = (): boolean => {
			if (!link.sheet) {
				return false;
			}

			const cssText = extractCssText(link.sheet);
			if (!cssText) {
				return false;
			}

			cacheStylesFromText(cssText);
			return true;
		};

		if (attemptLoad()) {
			resolvePendingRoots();
			return;
		}

		await new Promise<void>((resolve) => {
			link.addEventListener('load', () => resolve(), { once: true });
		});

		if (attemptLoad()) {
			resolvePendingRoots();
			return;
		}

		try {
			const response = await fetch(link.href);
			const text = await response.text();
			cacheStylesFromText(text);
		} catch {
			// Ignore fetch errors and fall through to clearing pending roots.
		}

		resolvePendingRoots();
	})();
};

export const applyGlobalShadowStyles = (root: ShadowRoot): void => {
	if (cachedSheet || cachedText) {
		applyStylesToRoot(root);
		return;
	}

	const source = document.querySelector(GLOBAL_STYLE_SELECTOR);
	if (!source) {
		return;
	}

	if (source instanceof HTMLStyleElement) {
		cacheStylesFromText(source.textContent ?? '');
		applyStylesToRoot(root);
		return;
	}

	if (source instanceof HTMLLinkElement) {
		pendingRoots.add(root);
		loadStylesFromLink(source);
	}
};
