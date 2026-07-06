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

describe('DialogRef native close (Escape-dismiss) handling', () => {
	let dialogEl: HTMLDialogElement;
	let ref: DialogRef;

	beforeEach(() => {
		dialogEl = document.createElement('dialog') as HTMLDialogElement;
		(dialogEl as any).showModal = vi.fn();
		// Mirror the native contract: close() fires the `close` event.
		(dialogEl as any).close = vi.fn(() => {
			dialogEl.dispatchEvent(new Event('close'));
		});
		document.body.appendChild(dialogEl);
		ref = new DialogRef(newID(), dialogEl);
	});

	afterEach(() => {
		dialogEl.remove();
	});

	it('fires afterClosed when the dialog closes natively (Escape path skips close())', () => {
		const cb = vi.fn();
		ref.afterClosed(cb);
		ref.open();

		// Escape: native cancel → close; DialogRef.close() is never called.
		dialogEl.dispatchEvent(new Event('close'));

		expect(cb).toHaveBeenCalledTimes(1);
		expect(cb).toHaveBeenCalledWith(undefined);
	});

	it('dismisses descendant popovers on native close (Escape path)', () => {
		const { el: pop, spy } = makePopover();
		dialogEl.appendChild(pop);
		ref.open();

		dialogEl.dispatchEvent(new Event('close'));

		expect(spy).toHaveBeenCalledTimes(1);
	});

	it('does not double-fire afterClosed when close() also triggers the native close event', () => {
		const cb = vi.fn();
		ref.afterClosed(cb);
		ref.open();

		ref.close('result' as any);

		expect(cb).toHaveBeenCalledTimes(1);
		expect(cb).toHaveBeenCalledWith('result');
	});

	it('does not double-dismiss descendant popovers when close() also triggers the native close event', () => {
		const { el: pop, spy } = makePopover();
		dialogEl.appendChild(pop);
		ref.open();

		ref.close();

		expect(spy).toHaveBeenCalledTimes(1);
	});

	it('fires afterClosed again on a subsequent open/close cycle', () => {
		const cb = vi.fn();
		ref.afterClosed(cb);

		ref.open();
		dialogEl.dispatchEvent(new Event('close'));
		ref.open();
		ref.close('second' as any);

		expect(cb).toHaveBeenCalledTimes(2);
		expect(cb).toHaveBeenLastCalledWith('second');
	});

	it('supports multiple afterOpened and afterClosed registrations, invoked in order', () => {
		const order: string[] = [];
		ref.afterOpened(() => order.push('opened-1'));
		ref.afterOpened(() => order.push('opened-2'));
		ref.afterClosed(() => order.push('closed-1'));
		ref.afterClosed(() => order.push('closed-2'));

		ref.open();
		ref.close();

		expect(order).toEqual(['opened-1', 'opened-2', 'closed-1', 'closed-2']);
	});

	it('emits ml:open and ml:close lifecycle events', () => {
		const openSpy = vi.fn();
		const closeSpy = vi.fn();
		dialogEl.addEventListener('ml:open', openSpy);
		dialogEl.addEventListener('ml:close', closeSpy);

		ref.open();
		expect(openSpy).toHaveBeenCalledTimes(1);

		ref.close('done' as any);
		expect(closeSpy).toHaveBeenCalledTimes(1);
		expect((closeSpy.mock.calls[0][0] as CustomEvent).detail).toEqual({ result: 'done' });
	});

	it('emits ml:close on native (Escape) dismissal', () => {
		const closeSpy = vi.fn();
		dialogEl.addEventListener('ml:close', closeSpy);

		ref.open();
		dialogEl.dispatchEvent(new Event('close'));

		expect(closeSpy).toHaveBeenCalledTimes(1);
	});
});
