/**
 * ARIA relationships that cross a shadow-root boundary.
 *
 * `aria-describedby`, `aria-labelledby` and friends are IDREFs, and an IDREF
 * only resolves within the same tree. A component whose description lives in
 * its shadow root therefore cannot point a light-DOM trigger at it — the
 * attribute is set, resolves to nothing, and the content is never announced.
 *
 * Element-reference properties (`ariaDescribedByElements`,
 * `ariaLabelledByElements`) do cross the boundary and are the correct fix
 * where they exist. Where they do not, the text itself is copied onto the
 * element via `aria-description` / `aria-label`, which is announced even
 * though it duplicates the string.
 */

interface IAriaElementReflection {
	ariaDescribedByElements?: Element[] | null;
	ariaLabelledByElements?: Element[] | null;
}

/** True when this engine supports ARIA element references. */
export function supportsAriaElementReferences(): boolean {
	return typeof Element !== 'undefined' && 'ariaDescribedByElements' in Element.prototype;
}

/**
 * Describe `target` with `describers`, which may live in another root.
 * Pass an empty array to clear the relationship.
 */
export function setCrossRootDescription(target: Element, describers: Element[]): void {
	const reflected = target as Element & IAriaElementReflection;

	if ('ariaDescribedByElements' in reflected) {
		reflected.ariaDescribedByElements = describers.length > 0 ? describers : null;
		target.removeAttribute('aria-description');
		return;
	}

	const text = describers
		.map((element) => element.textContent?.trim() ?? '')
		.filter(Boolean)
		.join('. ');

	if (text) {
		target.setAttribute('aria-description', text);
	} else {
		target.removeAttribute('aria-description');
	}
}

/** Label `target` with `labels`, which may live in another root. */
export function setCrossRootLabel(target: Element, labels: Element[]): void {
	const reflected = target as Element & IAriaElementReflection;

	if ('ariaLabelledByElements' in reflected) {
		reflected.ariaLabelledByElements = labels.length > 0 ? labels : null;
		return;
	}

	const text = labels
		.map((element) => element.textContent?.trim() ?? '')
		.filter(Boolean)
		.join(' ');

	if (text) {
		target.setAttribute('aria-label', text);
	} else {
		target.removeAttribute('aria-label');
	}
}

/**
 * Point `target` at the currently active option, which may live in another
 * root (a composite listbox's options are in the light DOM while the focused
 * control is inside a shadow root).
 */
export function setCrossRootActiveDescendant(target: Element, active: Element | null): void {
	const reflected = target as Element & { ariaActiveDescendantElement?: Element | null };

	if ('ariaActiveDescendantElement' in reflected) {
		reflected.ariaActiveDescendantElement = active;
		return;
	}

	if (active?.id) {
		target.setAttribute('aria-activedescendant', active.id);
	} else {
		target.removeAttribute('aria-activedescendant');
	}
}

/**
 * The element that actually takes focus for a (possibly composite) control.
 *
 * ARIA state must sit on the focusable node, not on a wrapper: setting
 * `aria-haspopup`/`aria-expanded` on an `<ml-button>` host leaves the real
 * `<button>` inside its shadow root announcing nothing.
 */
export function getFocusableControl(element: Element): HTMLElement {
	const root = element.shadowRoot;

	if (root) {
		const control = root.querySelector<HTMLElement>('button, [role="button"], a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
		if (control) {
			return control;
		}
	}

	return element as HTMLElement;
}

/** Remove any cross-root description this module applied. */
export function clearCrossRootDescription(target: Element): void {
	setCrossRootDescription(target, []);
}
