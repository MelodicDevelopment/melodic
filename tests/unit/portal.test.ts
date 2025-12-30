import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { html, render } from '../../src/template';
import { getRegisteredDirectives } from '../../src/template/directives/functions/attribute-directive.functions';
// Import portal directive to register it
import '../../src/template/directives/builtin/portal.directive';

describe('portal directive', () => {
	let container: HTMLElement;
	let portalTarget: HTMLElement;

	beforeEach(() => {
		container = document.createElement('div');
		document.body.appendChild(container);

		portalTarget = document.createElement('div');
		portalTarget.id = 'portal-target';
		document.body.appendChild(portalTarget);
	});

	afterEach(() => {
		container.remove();
		portalTarget.remove();
		// Clean up any portaled elements that might be left in body
		document.querySelectorAll('[data-testid="portaled"]').forEach((el) => el.remove());
	});

	it('should register the portal directive', () => {
		const directives = getRegisteredDirectives();
		expect(directives).toContain('portal');
	});

	it('should teleport element to body with static :portal="body"', () => {
		render(
			html`<div class="wrapper">
				<div class="modal" data-testid="portaled" :portal="body">Modal Content</div>
			</div>`,
			container
		);

		// Element should be moved to body, not in container
		const inContainer = container.querySelector('[data-testid="portaled"]');
		const inBody = document.body.querySelector('[data-testid="portaled"]');

		expect(inContainer).toBeNull();
		expect(inBody).not.toBeNull();
		expect(inBody?.textContent).toBe('Modal Content');
	});

	it('should teleport element to specific target with :portal="#id"', () => {
		render(
			html`<div class="wrapper">
				<div class="tooltip" data-testid="portaled" :portal="#portal-target">Tooltip</div>
			</div>`,
			container
		);

		// Element should be in the portal target
		const inTarget = portalTarget.querySelector('[data-testid="portaled"]');
		expect(inTarget).not.toBeNull();
		expect(inTarget?.textContent).toBe('Tooltip');
	});

	it('should leave placeholder comment at original position', () => {
		render(
			html`<div class="wrapper">
				<div data-testid="portaled" :portal="body">Content</div>
			</div>`,
			container
		);

		// Check for placeholder comment
		const wrapper = container.querySelector('.wrapper');
		const hasPlaceholder = Array.from(wrapper?.childNodes || []).some(
			(node) => node.nodeType === Node.COMMENT_NODE && (node as Comment).data === 'portal-placeholder'
		);
		expect(hasPlaceholder).toBe(true);
	});

	it('should work with dynamic content inside portaled element', () => {
		const message = 'Hello';
		render(
			html`<div class="wrapper">
				<div data-testid="portaled" :portal="body">${message}</div>
			</div>`,
			container
		);

		const portaled = document.body.querySelector('[data-testid="portaled"]');
		expect(portaled?.textContent).toBe('Hello');
	});

	it('should update portaled element when re-rendered', () => {
		render(
			html`<div class="wrapper">
				<div data-testid="portaled" class="first" :portal="body">First</div>
			</div>`,
			container
		);

		let portaled = document.body.querySelector('[data-testid="portaled"]');
		expect(portaled?.textContent).toBe('First');
		expect(portaled?.classList.contains('first')).toBe(true);

		// Re-render with different content
		render(
			html`<div class="wrapper">
				<div data-testid="portaled" class="second" :portal="body">Second</div>
			</div>`,
			container
		);

		portaled = document.body.querySelector('[data-testid="portaled"]');
		expect(portaled?.textContent).toBe('Second');
	});
});
