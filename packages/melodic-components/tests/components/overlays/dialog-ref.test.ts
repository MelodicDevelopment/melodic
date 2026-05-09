import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DialogRef } from '../../../src/components/overlays/dialog/dialog-ref.class';
import { newID } from '../../../src/functions';

/**
 * happy-dom does not implement the Popover API, so each element with
 * a `popover` attribute gets a stubbed `hidePopover` we can spy on.
 */
function makePopover(tag = 'div'): { el: HTMLElement; spy: ReturnType<typeof vi.fn> } {
	const el = document.createElement(tag);
	el.setAttribute('popover', 'auto');
	const spy = vi.fn();
	(el as any).hidePopover = spy;
	return { el, spy };
}

describe('DialogRef.close()', () => {
	let dialogEl: HTMLDialogElement;
	let ref: DialogRef;

	beforeEach(() => {
		dialogEl = document.createElement('dialog') as HTMLDialogElement;
		// happy-dom may not implement showModal/close; stub if missing
		if (typeof dialogEl.close !== 'function') {
			(dialogEl as any).close = vi.fn();
		}
		document.body.appendChild(dialogEl);
		ref = new DialogRef(newID(), dialogEl);
	});

	afterEach(() => {
		dialogEl.remove();
	});

	it('calls hidePopover() on direct popover descendants before closing', () => {
		const { el: popA, spy: spyA } = makePopover();
		const { el: popB, spy: spyB } = makePopover();
		dialogEl.appendChild(popA);
		dialogEl.appendChild(popB);

		const closeSpy = vi.spyOn(dialogEl, 'close');

		ref.close();

		expect(spyA).toHaveBeenCalledTimes(1);
		expect(spyB).toHaveBeenCalledTimes(1);
		expect(closeSpy).toHaveBeenCalledTimes(1);
		// Popovers must be dismissed before the dialog closes
		expect(spyA.mock.invocationCallOrder[0]).toBeLessThan(closeSpy.mock.invocationCallOrder[0]);
	});

	it('walks into nested shadow roots to dismiss popovers', () => {
		const host = document.createElement('div');
		dialogEl.appendChild(host);
		const shadow = host.attachShadow({ mode: 'open' });

		const { el: popInShadow, spy: shadowSpy } = makePopover();
		shadow.appendChild(popInShadow);

		ref.close();

		expect(shadowSpy).toHaveBeenCalledTimes(1);
	});

	it('recurses into deeply nested shadow roots', () => {
		const outer = document.createElement('div');
		dialogEl.appendChild(outer);
		const outerShadow = outer.attachShadow({ mode: 'open' });

		const inner = document.createElement('div');
		outerShadow.appendChild(inner);
		const innerShadow = inner.attachShadow({ mode: 'open' });

		const { el: deepPop, spy: deepSpy } = makePopover();
		innerShadow.appendChild(deepPop);

		ref.close();

		expect(deepSpy).toHaveBeenCalledTimes(1);
	});

	it('ignores elements without the popover attribute', () => {
		const plain = document.createElement('div');
		const spy = vi.fn();
		(plain as any).hidePopover = spy;
		dialogEl.appendChild(plain);

		ref.close();

		expect(spy).not.toHaveBeenCalled();
	});

	it('swallows errors from hidePopover() (e.g. not in top layer)', () => {
		const { el: pop } = makePopover();
		(pop as any).hidePopover = vi.fn(() => {
			throw new DOMException('Not currently showing', 'InvalidStateError');
		});
		dialogEl.appendChild(pop);

		const closeSpy = vi.spyOn(dialogEl, 'close');

		expect(() => ref.close()).not.toThrow();
		expect(closeSpy).toHaveBeenCalledTimes(1);
	});

	it('still closes the dialog when there are no popover descendants', () => {
		const closeSpy = vi.spyOn(dialogEl, 'close');
		ref.close();
		expect(closeSpy).toHaveBeenCalledTimes(1);
	});

	it('invokes the afterClosed callback with the result', () => {
		const cb = vi.fn();
		ref.afterClosed(cb);
		ref.close('done' as any);
		expect(cb).toHaveBeenCalledWith('done');
	});
});
