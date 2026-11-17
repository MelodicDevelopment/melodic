import { describe, it, expect, afterEach } from 'vitest';
import { setCrossRootDescription, setCrossRootLabel, canReferenceElement, clearCrossRootDescription } from '../../src/utils/accessibility/cross-root-aria';

/**
 * Element references (`ariaDescribedByElements`, …) only resolve when the
 * referenced element is in the referencing element's own tree or in one of
 * its shadow-including ANCESTOR trees. A light-DOM element pointing INTO a
 * shadow root is dropped by the browser — which is exactly the tooltip and
 * form-field case, so those must carry the text instead.
 *
 * happy-dom has no element reflection, so these tests install a plain
 * property on the target to stand in for an engine that supports it.
 */
function withElementReflection<T extends Element>(element: T): T & { ariaDescribedByElements: Element[] | null; ariaLabelledByElements: Element[] | null } {
	const target = element as any;
	target.ariaDescribedByElements = null;
	target.ariaLabelledByElements = null;
	return target;
}

afterEach(() => {
	document.body.innerHTML = '';
});

function shadowHostWith(inner: string): { host: HTMLElement; root: ShadowRoot } {
	const host = document.createElement('div');
	const root = host.attachShadow({ mode: 'open' });
	root.innerHTML = inner;
	document.body.appendChild(host);
	return { host, root };
}

describe('canReferenceElement', () => {
	it('allows the same tree', () => {
		document.body.innerHTML = '<button id="a"></button><span id="b"></span>';
		expect(canReferenceElement(document.getElementById('a')!, document.getElementById('b')!)).toBe(true);
	});

	it('allows pointing OUT of a shadow root at an ancestor tree', () => {
		const { host, root } = shadowHostWith('<dialog></dialog>');
		const header = document.createElement('h2');
		host.appendChild(header);
		expect(canReferenceElement(root.querySelector('dialog')!, header)).toBe(true);
	});

	it('refuses pointing IN to a shadow root from the light DOM', () => {
		const { host, root } = shadowHostWith('<div class="tip">Tip</div>');
		const trigger = document.createElement('button');
		host.appendChild(trigger);
		expect(canReferenceElement(trigger, root.querySelector('.tip')!)).toBe(false);
	});

	it('refuses pointing across to a sibling shadow root', () => {
		const a = shadowHostWith('<input>');
		const b = shadowHostWith('<span>Hint</span>');
		expect(canReferenceElement(a.root.querySelector('input')!, b.root.querySelector('span')!)).toBe(false);
	});
});

describe('setCrossRootDescription', () => {
	it('copies the text when the describer is inside a shadow root the target cannot reach — even if the engine has element references', () => {
		const { host, root } = shadowHostWith('<div class="tip">  Helpful\n   text </div>');
		const trigger = withElementReflection(document.createElement('button'));
		host.appendChild(trigger);

		setCrossRootDescription(trigger, [root.querySelector('.tip')!]);

		expect(trigger.getAttribute('aria-description')).toBe('Helpful text');
		expect(trigger.ariaDescribedByElements).toBeNull();
	});

	it('uses an element reference when the describer is reachable', () => {
		document.body.innerHTML = '<input id="field"><span id="hint">Hint</span>';
		const field = withElementReflection(document.getElementById('field')!);
		const hint = document.getElementById('hint')!;

		setCrossRootDescription(field, [hint]);

		expect(field.ariaDescribedByElements).toEqual([hint]);
		expect(field.hasAttribute('aria-description')).toBe(false);
	});

	it('updates and clears the copied text', () => {
		const { host, root } = shadowHostWith('<div class="tip">One</div>');
		const tip = root.querySelector('.tip')!;
		const trigger = document.createElement('button');
		host.appendChild(trigger);

		setCrossRootDescription(trigger, [tip]);
		tip.textContent = 'Two';
		setCrossRootDescription(trigger, [tip]);
		expect(trigger.getAttribute('aria-description')).toBe('Two');

		clearCrossRootDescription(trigger);
		expect(trigger.hasAttribute('aria-description')).toBe(false);
	});
});

describe('setCrossRootLabel', () => {
	it('references a light-DOM header from a shadow dialog where supported', () => {
		const { host, root } = shadowHostWith('<dialog></dialog>');
		const header = document.createElement('h2');
		header.textContent = 'Settings';
		host.appendChild(header);
		const dialog = withElementReflection(root.querySelector('dialog')!);

		setCrossRootLabel(dialog, [header]);
		expect(dialog.ariaLabelledByElements).toEqual([header]);
		expect(dialog.hasAttribute('aria-label')).toBe(false);
	});

	it('falls back to the text without element references', () => {
		const { host, root } = shadowHostWith('<dialog></dialog>');
		const header = document.createElement('h2');
		header.textContent = 'Settings';
		host.appendChild(header);
		const dialog = root.querySelector('dialog')!;

		setCrossRootLabel(dialog, [header]);
		expect(dialog.getAttribute('aria-label')).toBe('Settings');

		setCrossRootLabel(dialog, []);
		expect(dialog.hasAttribute('aria-label')).toBe(false);
	});
});
