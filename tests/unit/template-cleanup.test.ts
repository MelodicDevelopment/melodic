import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { html, render } from '../../src/template';
import { when } from '../../src/template/directives/builtin/when.directive';
import { repeat } from '../../src/template/directives/builtin/repeat.directive';
import {
	registerAttributeDirective,
	unregisterAttributeDirective
} from '../../src/template/directives/functions/attribute-directive.functions';
import { MelodicComponent } from '../../src/components/decorators/melodic-component.decorator';
import { createFormControl } from '../../src/forms';

function flushMicrotasks(): Promise<void> {
	return new Promise((resolve) => queueMicrotask(resolve));
}

describe('recursive part disposal', () => {
	let container: HTMLElement;
	let cleanups: number;
	let setups: number;

	beforeEach(() => {
		container = document.createElement('div');
		cleanups = 0;
		setups = 0;

		registerAttributeDirective('track', (element) => {
			setups += 1;
			element.setAttribute('data-tracked', '');
			return () => {
				cleanups += 1;
			};
		});
	});

	afterEach(() => {
		unregisterAttributeDirective('track');
	});

	it('runs directive cleanup when a when() branch is removed (true → false)', () => {
		const template = (cond: boolean) => html`<div>${when(cond, () => html`<span :track=${1}></span>`)}</div>`;

		render(template(true), container);
		expect(setups).toBe(1);
		expect(cleanups).toBe(0);

		render(template(false), container);
		expect(cleanups).toBe(1);

		// Toggle back on: fresh setup, no double-cleanup.
		render(template(true), container);
		expect(setups).toBe(2);
		expect(cleanups).toBe(1);

		render(template(false), container);
		expect(cleanups).toBe(2);
	});

	it('runs cleanup for content nested in when() branches (when inside when)', () => {
		const template = (outer: boolean) =>
			html`<div>${when(outer, () => html`<section>${when(true, () => html`<span :track=${1}></span>`)}</section>`)}</div>`;

		render(template(true), container);
		expect(setups).toBe(1);

		render(template(false), container);
		expect(cleanups).toBe(1);
	});

	it('runs directive cleanup for removed repeat() items only', () => {
		const template = (items: number[]) =>
			html`<ul>${repeat(
				items,
				(i) => i,
				(i) => html`<li :track=${i}>${i}</li>`
			)}</ul>`;

		render(template([1, 2, 3]), container);
		expect(setups).toBe(3);
		expect(cleanups).toBe(0);

		render(template([1, 3]), container);
		expect(cleanups).toBe(1);
		expect(container.querySelectorAll('li').length).toBe(2);

		render(template([]), container);
		expect(cleanups).toBe(3);
	});

	it('disposes nested template content replaced by a different template structure', () => {
		const withDirective = () => html`<div>${html`<span :track=${1}>a</span>`}</div>`;
		const withoutDirective = () => html`<div>${html`<em>b</em>`}</div>`;

		render(withDirective(), container);
		expect(setups).toBe(1);

		render(withoutDirective(), container);
		expect(cleanups).toBe(1);
		expect(container.textContent).toContain('b');
	});

	it('disposes removed non-keyed array items without disposing the reused ones', () => {
		const template = (items: number[]) => html`<div>${items.map((i) => html`<span :track=${i}>${i}</span>`)}</div>`;

		render(template([1, 2]), container);
		expect(setups).toBe(2);

		// Unkeyed arrays are reused positionally: index 0 survives untouched (no
		// cleanup, no re-setup) and only the dropped tail item is disposed.
		render(template([1]), container);
		expect(cleanups).toBe(1);
		expect(setups).toBe(2);

		render(template([]), container);
		expect(cleanups).toBe(2);
	});

	it(':formControl cleanup runs when a when() branch removes the control binding', () => {
		const control = createFormControl<string>('hello');

		// Count live subscriptions on the control's value signal.
		let activeValueSubscriptions = 0;
		const originalSubscribe = control.value.subscribe.bind(control.value);
		control.value.subscribe = (subscriber) => {
			activeValueSubscriptions += 1;
			const unsubscribe = originalSubscribe(subscriber);
			return () => {
				activeValueSubscriptions -= 1;
				unsubscribe();
			};
		};

		const template = (cond: boolean) => html`<div>${when(cond, () => html`<input :formControl=${control} />`)}</div>`;

		render(template(true), container);
		const input = container.querySelector('input') as HTMLInputElement;
		expect(input.hasAttribute('data-form-control')).toBe(true);
		expect(activeValueSubscriptions).toBe(1);

		render(template(false), container);

		// The directive's cleanup ran: subscriptions released, marker attribute removed.
		expect(activeValueSubscriptions).toBe(0);
		expect(input.hasAttribute('data-form-control')).toBe(false);

		control.destroy();
	});

	it('disposes the whole nested tree on host destroy (when + :formControl + action directive)', async () => {
		const control = createFormControl<string>('x');

		let activeValueSubscriptions = 0;
		const originalSubscribe = control.value.subscribe.bind(control.value);
		control.value.subscribe = (subscriber) => {
			activeValueSubscriptions += 1;
			const unsubscribe = originalSubscribe(subscriber);
			return () => {
				activeValueSubscriptions -= 1;
				unsubscribe();
			};
		};

		class NestedCleanupHostComponent {
			show = true;
		}

		MelodicComponent({
			selector: 'test-nested-cleanup-host',
			template: (c: NestedCleanupHostComponent) =>
				html`<div>
					${when(c.show, () => html`<section><input :formControl=${control} /><span :track=${1}></span></section>`)}
				</div>`
		})(NestedCleanupHostComponent);

		const element = document.createElement('test-nested-cleanup-host');
		document.body.appendChild(element);
		await flushMicrotasks();

		expect(setups).toBe(1);
		expect(activeValueSubscriptions).toBe(1);

		document.body.removeChild(element);
		// Teardown is deferred one microtask (transient-move protection).
		await flushMicrotasks();

		expect(cleanups).toBe(1);
		expect(activeValueSubscriptions).toBe(0);

		control.destroy();
	});

	it('disposes repeat() content on host destroy', async () => {
		class RepeatCleanupHostComponent {
			items = [1, 2];
		}

		MelodicComponent({
			selector: 'test-repeat-cleanup-host',
			template: (c: RepeatCleanupHostComponent) =>
				html`<ul>${repeat(
					c.items,
					(i) => i,
					(i) => html`<li :track=${i}></li>`
				)}</ul>`
		})(RepeatCleanupHostComponent);

		const element = document.createElement('test-repeat-cleanup-host');
		document.body.appendChild(element);
		await flushMicrotasks();

		expect(setups).toBe(2);

		document.body.removeChild(element);
		await flushMicrotasks();

		expect(cleanups).toBe(2);
	});
});
