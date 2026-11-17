import { describe, it, expect, afterEach } from 'vitest';
import { createFocusTrap, getDeepActiveElement } from '../../src/utils/accessibility/focus-trap';
import { getFocusableElements } from '../../src/utils/accessibility/focus-utils';

/** happy-dom reports offsetParent as null; make elements pass the visibility filter. */
function makeFocusableButton(label: string): HTMLButtonElement {
	const button = document.createElement('button');
	button.textContent = label;
	Object.defineProperty(button, 'offsetParent', { get: () => document.body });
	return button;
}

function pressTab(target: Element, shiftKey = false): KeyboardEvent {
	const event = new KeyboardEvent('keydown', { key: 'Tab', shiftKey, bubbles: true, composed: true, cancelable: true });
	target.dispatchEvent(event);
	return event;
}

afterEach(() => {
	document.body.innerHTML = '';
});

describe('createFocusTrap inside shadow DOM', () => {
	function setupShadowTrap() {
		const host = document.createElement('div');
		document.body.appendChild(host);
		const shadow = host.attachShadow({ mode: 'open' });

		const container = document.createElement('div');
		shadow.appendChild(container);

		const first = makeFocusableButton('first');
		const last = makeFocusableButton('last');
		container.append(first, last);

		return { host, shadow, container, first, last };
	}

	it('wraps Tab from the last element back to the first (shadow-root activeElement)', () => {
		const { container, first, last } = setupShadowTrap();
		const trap = createFocusTrap(container, { autoFocus: false });
		trap.activate();

		last.focus();
		const event = pressTab(last);

		expect(event.defaultPrevented).toBe(true);
		expect(getDeepActiveElement()).toBe(first);

		trap.deactivate({ returnFocus: false });
	});

	it('wraps Shift+Tab from the first element to the last', () => {
		const { container, first, last } = setupShadowTrap();
		const trap = createFocusTrap(container, { autoFocus: false });
		trap.activate();

		first.focus();
		const event = pressTab(first, true);

		expect(event.defaultPrevented).toBe(true);
		expect(getDeepActiveElement()).toBe(last);

		trap.deactivate({ returnFocus: false });
	});

	it('auto-focuses the first focusable on activate', () => {
		const { container, first } = setupShadowTrap();
		const trap = createFocusTrap(container);
		trap.activate();

		expect(getDeepActiveElement()).toBe(first);

		trap.deactivate({ returnFocus: false });
	});

	it('restores focus to the previously focused element on deactivate', () => {
		const outside = makeFocusableButton('outside');
		document.body.appendChild(outside);
		outside.focus();

		const { container } = setupShadowTrap();
		const trap = createFocusTrap(container);
		trap.activate();
		expect(getDeepActiveElement()).not.toBe(outside);

		trap.deactivate();
		expect(getDeepActiveElement()).toBe(outside);
	});

	it('deactivate({ returnFocus: false }) leaves focus where it is', () => {
		const outside = makeFocusableButton('outside');
		document.body.appendChild(outside);
		outside.focus();

		const { container, first } = setupShadowTrap();
		const trap = createFocusTrap(container);
		trap.activate();
		expect(getDeepActiveElement()).toBe(first);

		trap.deactivate({ returnFocus: false });
		expect(getDeepActiveElement()).toBe(first);
	});

	it('traps slotted (light DOM) content projected through a <slot>', () => {
		const host = document.createElement('div');
		document.body.appendChild(host);
		const shadow = host.attachShadow({ mode: 'open' });

		const container = document.createElement('div');
		container.appendChild(document.createElement('slot'));
		shadow.appendChild(container);

		const slottedButton = makeFocusableButton('slotted');
		host.appendChild(slottedButton);

		const trap = createFocusTrap(container);
		trap.activate();

		expect(getDeepActiveElement()).toBe(slottedButton);

		trap.deactivate({ returnFocus: false });
	});
});

describe('getDeepActiveElement', () => {
	it('resolves the focused element through nested shadow roots', () => {
		const host = document.createElement('div');
		document.body.appendChild(host);
		const shadow = host.attachShadow({ mode: 'open' });
		const inner = makeFocusableButton('inner');
		shadow.appendChild(inner);

		inner.focus();

		expect(document.activeElement).toBe(host);
		expect(getDeepActiveElement()).toBe(inner);
	});
});

describe('focusables inside nested shadow roots', () => {
	/** A stand-in for <ml-input>: a host whose only focusable lives in its shadow root. */
	function makeShadowControl(): { host: HTMLElement; inner: HTMLInputElement } {
		const host = document.createElement('div');
		const shadow = host.attachShadow({ mode: 'open' });
		const inner = document.createElement('input');
		Object.defineProperty(inner, 'offsetParent', { get: () => document.body });
		shadow.appendChild(inner);
		return { host, inner };
	}

	it('getFocusableElements only sees the container tree by default', () => {
		const container = document.createElement('div');
		document.body.appendChild(container);
		const { host } = makeShadowControl();
		const button = makeFocusableButton('ok');
		container.append(host, button);

		expect(getFocusableElements(container)).toEqual([button]);
	});

	it('getFocusableElements({ deep: true }) descends into shadow roots, in tab order', () => {
		const container = document.createElement('div');
		document.body.appendChild(container);
		const { host, inner } = makeShadowControl();
		const button = makeFocusableButton('ok');
		container.append(host, button);

		expect(getFocusableElements(container, { deep: true })).toEqual([inner, button]);
	});

	it('traps Tab across a slotted shadow-hosted control and a native button', () => {
		// Shadow container with a <slot>, like ml-popover's content element.
		const popoverHost = document.createElement('div');
		document.body.appendChild(popoverHost);
		const shadow = popoverHost.attachShadow({ mode: 'open' });
		const container = document.createElement('div');
		container.appendChild(document.createElement('slot'));
		shadow.appendChild(container);

		const { host, inner } = makeShadowControl();
		const button = makeFocusableButton('ok');
		popoverHost.append(host, button);

		const trap = createFocusTrap(container, { autoFocus: false });
		trap.activate();

		// Tab from the last element (the button) wraps to the shadow input —
		// it used to wrap to the button itself, leaving the input unreachable.
		button.focus();
		const forward = pressTab(button);
		expect(forward.defaultPrevented).toBe(true);
		expect(getDeepActiveElement()).toBe(inner);

		// Shift+Tab from the first element (the shadow input) wraps to the button.
		const backward = pressTab(inner, true);
		expect(backward.defaultPrevented).toBe(true);
		expect(getDeepActiveElement()).toBe(button);

		trap.deactivate({ returnFocus: false });
	});
});
