import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '../../../src/components/overlays/drawer/index';
import { flush } from '../../helpers/component-test-utils';

interface StubAnimation {
	onfinish: (() => void) | null;
	cancel: () => void;
}

describe('ml-drawer lifecycle events', () => {
	let host: HTMLElement;
	let dialogEl: HTMLDialogElement;
	let panelEl: HTMLElement;
	let animations: StubAnimation[];
	let animateArgs: Array<{ keyframes: unknown; options: KeyframeAnimationOptions }>;

	beforeEach(async () => {
		host = document.createElement('ml-drawer');
		host.innerHTML = '<p>Content</p>';
		document.body.appendChild(host);
		await flush();
		await flush();

		dialogEl = host.shadowRoot?.querySelector('dialog') as HTMLDialogElement;
		panelEl = dialogEl.querySelector('.ml-drawer__panel') as HTMLElement;

		// happy-dom lacks the dialog modal + Web Animations APIs; stub them.
		(dialogEl as any).showModal = vi.fn(() => {
			(dialogEl as any).open = true;
		});
		(dialogEl as any).close = vi.fn(() => {
			(dialogEl as any).open = false;
			dialogEl.dispatchEvent(new Event('close'));
		});

		animations = [];
		animateArgs = [];
		(panelEl as any).getAnimations = () => [];
		(panelEl as any).animate = vi.fn((keyframes: unknown, options: KeyframeAnimationOptions) => {
			const anim: StubAnimation = { onfinish: null, cancel: vi.fn() };
			animations.push(anim);
			animateArgs.push({ keyframes, options });
			return anim;
		});
	});

	afterEach(() => {
		document.body.innerHTML = '';
	});

	function getDrawer(): { open: () => void; close: () => void } {
		// Methods live on the component instance, exposed via `.component`.
		return (host as unknown as { component: { open: () => void; close: () => void } }).component;
	}

	it('fires ml:open at start and ml:opened only after the animation finishes', () => {
		const openSpy = vi.fn();
		const openedSpy = vi.fn();
		host.addEventListener('ml:open', openSpy);
		host.addEventListener('ml:opened', openedSpy);

		getDrawer().open();

		expect(openSpy).toHaveBeenCalledTimes(1);
		expect(openedSpy).not.toHaveBeenCalled();

		animations[0].onfinish?.();

		expect(openedSpy).toHaveBeenCalledTimes(1);
	});

	it('fires ml:close at start and ml:closed after the animation finishes and the dialog closes', () => {
		const closeSpy = vi.fn();
		const closedSpy = vi.fn();
		host.addEventListener('ml:close', closeSpy);
		host.addEventListener('ml:closed', closedSpy);

		getDrawer().open();
		animations[0].onfinish?.();

		getDrawer().close();

		expect(closeSpy).toHaveBeenCalledTimes(1);
		expect(closedSpy).not.toHaveBeenCalled();
		expect((dialogEl as any).close).not.toHaveBeenCalled();

		animations[1].onfinish?.();

		expect((dialogEl as any).close).toHaveBeenCalledTimes(1);
		expect(closedSpy).toHaveBeenCalledTimes(1);
	});

	it('slides with a transform, not layout properties, and leaves no animation behind', () => {
		getDrawer().open();

		const frames = animateArgs[0].keyframes as Array<Record<string, string>>;
		expect(frames.map((frame) => Object.keys(frame))).toEqual([['transform'], ['transform']]);
		expect(frames[0].transform).toBe('translateX(100%)');
		expect(frames[1].transform).toBe('translateX(0)');

		animations[0].onfinish?.();
		expect(animations[0].cancel).toHaveBeenCalled();
	});

	it('slides in from the left for side="left"', async () => {
		host.setAttribute('side', 'left');
		await flush();
		getDrawer().open();
		const frames = animateArgs[0].keyframes as Array<Record<string, string>>;
		expect(frames[0].transform).toBe('translateX(-100%)');
	});

	it('open() during the close animation reopens instead of being swallowed', () => {
		const closedSpy = vi.fn();
		const openedSpy = vi.fn();
		host.addEventListener('ml:closed', closedSpy);
		host.addEventListener('ml:opened', openedSpy);

		getDrawer().open();
		animations[0].onfinish?.();
		expect(openedSpy).toHaveBeenCalledTimes(1);

		getDrawer().close(); // slide-out starts; dialog is still open
		getDrawer().open(); // changed their mind

		// A fresh slide-in was started without re-calling showModal().
		expect(animations).toHaveLength(3);
		expect((dialogEl as any).showModal).toHaveBeenCalledTimes(1);

		animations[2].onfinish?.();
		expect(openedSpy).toHaveBeenCalledTimes(2);
		expect((dialogEl as any).close).not.toHaveBeenCalled();
		expect(closedSpy).not.toHaveBeenCalled();
		expect((dialogEl as any).open).toBe(true);
	});

	it('skips the slide when the user prefers reduced motion', () => {
		const original = window.matchMedia;
		(window as any).matchMedia = (query: string) => ({ matches: query.includes('prefers-reduced-motion'), media: query, addEventListener() {}, removeEventListener() {} });
		try {
			getDrawer().open();
			expect(animateArgs[0].options.duration).toBe(0);
		} finally {
			(window as any).matchMedia = original;
		}
	});

	it('names the dialog from the label attribute, else from the slotted header', async () => {
		const header = document.createElement('div');
		header.slot = 'drawer-header';
		header.textContent = 'Settings';
		host.appendChild(header);
		await flush();
		await flush();
		(host as any).component.onRender();

		const named = dialogEl as HTMLDialogElement & { ariaLabelledByElements?: Element[] | null };
		const name = named.getAttribute('aria-label') ?? (named.ariaLabelledByElements ?? []).map((el) => el.textContent).join(' ');
		expect(name).toBe('Settings');

		host.setAttribute('label', 'Account settings');
		await flush();
		await flush();
		expect(dialogEl.getAttribute('aria-label')).toBe('Account settings');
	});

	it('animates with the token-derived timing (falls back to 300ms / spring easing)', () => {
		getDrawer().open();

		const { options } = animateArgs[0];
		expect(options.duration).toBe(300);
		expect(String(options.easing)).toContain('cubic-bezier');
	});
});
