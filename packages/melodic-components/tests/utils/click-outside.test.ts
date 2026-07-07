import { describe, it, expect, vi, afterEach } from 'vitest';
import { clickOutside } from '../../src/utils/directives/click-outside.directive';

afterEach(() => {
	document.body.innerHTML = '';
});

describe('clickOutside()', () => {
	it('invokes the callback for clicks outside the element', () => {
		const inside = document.createElement('div');
		const outside = document.createElement('div');
		document.body.append(inside, outside);

		const callback = vi.fn();
		const cleanup = clickOutside(inside, callback);

		outside.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
		expect(callback).toHaveBeenCalledTimes(1);

		cleanup();
	});

	it('does not invoke the callback for clicks inside the element', () => {
		const inside = document.createElement('div');
		const child = document.createElement('span');
		inside.appendChild(child);
		document.body.appendChild(inside);

		const callback = vi.fn();
		const cleanup = clickOutside(inside, callback);

		child.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
		expect(callback).not.toHaveBeenCalled();

		cleanup();
	});

	it('treats clicks inside a shadow root hosted within the element as inside (composedPath)', () => {
		const wrapper = document.createElement('div');
		const host = document.createElement('div');
		wrapper.appendChild(host);
		document.body.appendChild(wrapper);

		const shadow = host.attachShadow({ mode: 'open' });
		const shadowButton = document.createElement('button');
		shadow.appendChild(shadowButton);

		const callback = vi.fn();
		const cleanup = clickOutside(wrapper, callback);

		// The document-level target is retargeted to `host`; the old
		// element.contains(target) check handled that, but content nested one
		// shadow level deeper still had to pass through the wrapper.
		shadowButton.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
		expect(callback).not.toHaveBeenCalled();

		cleanup();
	});

	it('treats clicks inside the shadow root OF the watched element itself as inside', () => {
		const host = document.createElement('div');
		document.body.appendChild(host);
		const shadow = host.attachShadow({ mode: 'open' });
		const shadowButton = document.createElement('button');
		shadow.appendChild(shadowButton);

		const callback = vi.fn();
		const cleanup = clickOutside(host, callback);

		shadowButton.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
		expect(callback).not.toHaveBeenCalled();

		cleanup();
	});

	it('flags clicks in an unrelated shadow root as outside', () => {
		const watched = document.createElement('div');
		const otherHost = document.createElement('div');
		document.body.append(watched, otherHost);

		const shadow = otherHost.attachShadow({ mode: 'open' });
		const shadowButton = document.createElement('button');
		shadow.appendChild(shadowButton);

		const callback = vi.fn();
		const cleanup = clickOutside(watched, callback);

		shadowButton.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
		expect(callback).toHaveBeenCalledTimes(1);

		cleanup();
	});

	it('stops listening after cleanup', () => {
		const inside = document.createElement('div');
		const outside = document.createElement('div');
		document.body.append(inside, outside);

		const callback = vi.fn();
		const cleanup = clickOutside(inside, callback);
		cleanup();

		outside.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
		expect(callback).not.toHaveBeenCalled();
	});
});
