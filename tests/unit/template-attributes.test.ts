import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { html, render } from '../../src/template';
import { registerAttributeDirective, unregisterAttributeDirective } from '../../src/template/directives/functions/attribute-directive.functions';

describe('template attributes', () => {
	let container: HTMLElement;

	beforeEach(() => {
		container = document.createElement('div');
	});

	afterEach(() => {
		unregisterAttributeDirective('test');
	});

	it('handles composite attributes', () => {
		let name = 'Ada';

		render(html`<div title="Hello ${name}!"></div>`, container);
		const first = container.querySelector('div');
		expect(first?.getAttribute('title')).toBe('Hello Ada!');

		name = 'Bob';
		render(html`<div title="Hello ${name}!"></div>`, container);
		const second = container.querySelector('div');
		expect(second?.getAttribute('title')).toBe('Hello Bob!');
	});

	it('applies and removes boolean attributes', () => {
		render(html`<button disabled=${true}>Click</button>`, container);
		const button = container.querySelector('button');
		expect(button?.hasAttribute('disabled')).toBe(true);

		render(html`<button disabled=${false}>Click</button>`, container);
		expect(button?.hasAttribute('disabled')).toBe(false);
	});

	it('runs action directives and cleans up on updates', () => {
		let calls = 0;
		let cleanups = 0;

		registerAttributeDirective('test', (element, value) => {
			calls += 1;
			element.setAttribute('data-test', String(value));
			return () => {
				cleanups += 1;
				element.removeAttribute('data-test');
			};
		});

		render(html`<div :test=${'one'}></div>`, container);
		const element = container.querySelector('div');
		expect(calls).toBe(1);
		expect(element?.getAttribute('data-test')).toBe('one');

		render(html`<div :test=${'two'}></div>`, container);
		expect(calls).toBe(2);
		expect(cleanups).toBe(1);
		expect(element?.getAttribute('data-test')).toBe('two');
	});

	it('executes static action directives once (case-insensitive lookup)', () => {
		let calls = 0;

		registerAttributeDirective('MyAction', (element, value) => {
			calls += 1;
			element.setAttribute('data-action', String(value));
		});

		render(html`<div :myaction="static"></div>`, container);
		const element = container.querySelector('div');
		expect(calls).toBe(1);
		expect(element?.getAttribute('data-action')).toBe('static');

		render(html`<div :myaction="static"></div>`, container);
		expect(calls).toBe(1);
	});

	it('cleans up action directives when template changes', () => {
		let cleanups = 0;

		registerAttributeDirective('cleanupSwitch', () => {
			return () => {
				cleanups += 1;
			};
		});

		render(html`<div :cleanupSwitch=${'one'}></div>`, container);
		render(html`<span>Next</span>`, container);

		expect(cleanups).toBe(1);
	});
});
