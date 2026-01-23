let globalStylesAttribute = 'melodic-styles';

const cachedSheets: CSSStyleSheet[] = [];
const cachedTexts: string[] = [];
const loadPromises = new Map<HTMLLinkElement, Promise<void>>();
const pendingRoots = new Set<ShadowRoot>();

const supportsConstructableStylesheets = (): boolean => {
	return 'adoptedStyleSheets' in Document.prototype && 'replaceSync' in CSSStyleSheet.prototype;
};

const getGlobalStylesSelector = (): string => `style[${globalStylesAttribute}], link[${globalStylesAttribute}][rel="stylesheet"]`;

export const getGlobalStylesAttribute = (): string => globalStylesAttribute;

export const setGlobalStylesAttribute = (attribute: string): void => {
	const normalized = attribute.trim();
	if (!normalized) {
		return;
	}

	globalStylesAttribute = normalized;
};

const applyStylesToRoot = (root: ShadowRoot): void => {
	if (cachedSheets.length > 0 && 'adoptedStyleSheets' in root) {
		const adopted = root.adoptedStyleSheets ?? [];
		const newSheets = cachedSheets.filter((sheet) => !adopted.includes(sheet));
		if (newSheets.length > 0) {
			root.adoptedStyleSheets = [...adopted, ...newSheets];
		}
		return;
	}

	if (cachedTexts.length > 0) {
		const combinedText = cachedTexts.join('\n');
		const styleNode = document.createElement('style');
		styleNode.textContent = combinedText;
		root.appendChild(styleNode);
	}
};

const cacheStylesFromText = (text: string): void => {
	const trimmed = text.trim();
	if (trimmed.length === 0) {
		return;
	}

	if (supportsConstructableStylesheets()) {
		const sheet = new CSSStyleSheet();
		sheet.replaceSync(trimmed);
		cachedSheets.push(sheet);
		return;
	}

	cachedTexts.push(trimmed);
};

export const registerGlobalStyles = (styles: string | CSSStyleSheet): void => {
	if (!styles) {
		return;
	}

	if (typeof styles === 'string') {
		cacheStylesFromText(styles);
		resolvePendingRoots();
		return;
	}

	if (supportsConstructableStylesheets()) {
		if (!cachedSheets.includes(styles)) {
			cachedSheets.push(styles);
		}
		resolvePendingRoots();
		return;
	}

	const text = extractCssText(styles);
	if (text) {
		cacheStylesFromText(text);
		resolvePendingRoots();
	}
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

const hasLoadedStyles = (): boolean => cachedSheets.length > 0 || cachedTexts.length > 0;

const resolvePendingRoots = (): void => {
	if (!hasLoadedStyles()) {
		return;
	}

	for (const root of pendingRoots) {
		applyStylesToRoot(root);
	}
	pendingRoots.clear();
};

const loadStylesFromLink = (link: HTMLLinkElement): Promise<void> => {
	const existing = loadPromises.get(link);
	if (existing) {
		return existing;
	}

	const promise = (async () => {
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
			return;
		}

		await new Promise<void>((resolve) => {
			link.addEventListener('load', () => resolve(), { once: true });
		});

		if (attemptLoad()) {
			return;
		}

		try {
			const response = await fetch(link.href);
			const text = await response.text();
			cacheStylesFromText(text);
		} catch {
			// Ignore fetch errors
		}
	})();

	loadPromises.set(link, promise);
	return promise;
};

export const applyGlobalStyles = (root: ShadowRoot): void => {
	if (hasLoadedStyles()) {
		applyStylesToRoot(root);
		return;
	}

	const sources = document.querySelectorAll(getGlobalStylesSelector());
	if (sources.length === 0) {
		return;
	}

	const linkPromises: Promise<void>[] = [];

	for (const source of sources) {
		if (source instanceof HTMLStyleElement) {
			cacheStylesFromText(source.textContent ?? '');
		} else if (source instanceof HTMLLinkElement) {
			linkPromises.push(loadStylesFromLink(source));
		}
	}

	if (linkPromises.length > 0) {
		pendingRoots.add(root);
		Promise.all(linkPromises).then(() => resolvePendingRoots());
		return;
	}

	if (hasLoadedStyles()) {
		applyStylesToRoot(root);
	}
};
