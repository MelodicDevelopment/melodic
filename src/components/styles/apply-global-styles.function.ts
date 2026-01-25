const globalStylesAttribute: string = 'melodic-styles';
const globalStyleSelector: string = `style[${globalStylesAttribute}], link[rel="stylesheet"][${globalStylesAttribute}]`;

const cachedCssSheets: CSSStyleSheet[] = [];
let loadingPromise: Promise<void> | null = null;

export const applyGlobalStyles = (root: ShadowRoot): void => {
	if (hasCachedSheets()) {
		applyAdoptedSheets(root);
		return;
	}

	if (!loadingPromise) {
		loadingPromise = loadStyles();
	}

	loadingPromise.then(() => applyAdoptedSheets(root));
};

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
				});
			}

			cacheCssSheet(
				Array.from(element.sheet?.cssRules ?? [])
					.map((rule) => rule.cssText)
					.join('\n')
			);
		}
	}
};

const applyAdoptedSheets = (root: ShadowRoot): void => {
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
