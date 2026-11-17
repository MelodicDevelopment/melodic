/**
 * ARIA relationships that cross a shadow-root boundary.
 *
 * `aria-describedby`, `aria-labelledby` and friends are IDREFs, and an IDREF
 * only resolves within the same tree. Element-reference properties
 * (`ariaDescribedByElements`, `ariaLabelledByElements`) relax that — but only
 * in ONE direction: the referenced element must live in the same tree as the
 * referencing element or in one of its shadow-including ANCESTOR trees. A
 * control inside a shadow root may point OUT at light-DOM content; a light-DOM
 * element may not point IN at something inside a (sibling or descendant)
 * shadow root — the browser silently drops such a reference.
 *
 * That inward case is exactly a slotted trigger described by a tooltip's
 * shadow content, or a slotted control described by a form field's shadow
 * hint. For those the text itself is copied onto the element via
 * `aria-description` / `aria-label`, which is announced.
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
 * True when an element reference from `from` to `to` will be honoured: `to`
 * is in `from`'s own tree or in one of its shadow-including ancestor trees.
 */
export function canReferenceElement(from: Element, to: Element): boolean {
	const targetRoot = to.getRootNode();
	let root: Node | null = from.getRootNode();

	while (root) {
		if (root === targetRoot) {
			return true;
		}
		root = root instanceof ShadowRoot ? root.host.getRootNode() : null;
	}

	return false;
}

function canReferenceAll(from: Element, elements: Element[]): boolean {
	return elements.every((element) => canReferenceElement(from, element));
}

function joinedText(elements: Element[], separator: string): string {
	return elements
		.map((element) => element.textContent?.replace(/\s+/g, ' ').trim() ?? '')
		.filter(Boolean)
		.join(separator);
}

/**
 * Describe `target` with `describers`, which may live in another root.
 * Pass an empty array to clear the relationship.
 */
export function setCrossRootDescription(target: Element, describers: Element[]): void {
	const reflected = target as Element & IAriaElementReflection;
	const supportsReferences = 'ariaDescribedByElements' in reflected;

	if (supportsReferences && describers.length > 0 && canReferenceAll(target, describers)) {
		reflected.ariaDescribedByElements = describers;
		target.removeAttribute('aria-description');
		return;
	}

	// Drop a reference we set earlier (only ours: a consumer's own
	// aria-describedby IDREF list is left alone).
	if (supportsReferences && reflected.ariaDescribedByElements?.length && !target.getAttribute('aria-describedby')) {
		reflected.ariaDescribedByElements = null;
	}

	const text = joinedText(describers, '. ');

	if (text) {
		if (target.getAttribute('aria-description') !== text) {
			target.setAttribute('aria-description', text);
		}
	} else {
		target.removeAttribute('aria-description');
	}
}

/** Label `target` with `labels`, which may live in another root. */
export function setCrossRootLabel(target: Element, labels: Element[]): void {
	const reflected = target as Element & IAriaElementReflection;
	const supportsReferences = 'ariaLabelledByElements' in reflected;

	if (supportsReferences && labels.length > 0 && canReferenceAll(target, labels)) {
		reflected.ariaLabelledByElements = labels;
		target.removeAttribute('aria-label');
		return;
	}

	if (supportsReferences && reflected.ariaLabelledByElements?.length && !target.getAttribute('aria-labelledby')) {
		reflected.ariaLabelledByElements = null;
	}

	const text = joinedText(labels, ' ');

	if (text) {
		if (target.getAttribute('aria-label') !== text) {
			target.setAttribute('aria-label', text);
		}
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
