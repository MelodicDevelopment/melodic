import { describe, it, expect } from 'vitest';
import { MelodicComponent } from '../../src/components/decorators/melodic-component.decorator';
import { getActiveComponent } from '../../src/components/functions/active-component.functions';
import { html } from '../../src/template';

function flushMicrotasks(): Promise<void> {
	return new Promise((resolve) => queueMicrotask(resolve));
}

describe('active-component context', () => {
	it('returns null outside of any component callback', () => {
		expect(getActiveComponent()).toBeNull();
	});

	it('getActiveComponent() returns the host element during template render and onCreate', async () => {
		let activeDuringRender: unknown = 'unset';
		let activeDuringOnCreate: unknown = 'unset';

		class ActiveProbeComponent {
			value = 0;

			onCreate(): void {
				activeDuringOnCreate = getActiveComponent();
			}
		}

		MelodicComponent({
			selector: 'test-active-probe',
			template: (component: ActiveProbeComponent) => {
				activeDuringRender = getActiveComponent();
				return html`<span>${component.value}</span>`;
			}
		})(ActiveProbeComponent);

		const element = document.createElement('test-active-probe');
		document.body.appendChild(element);
		await flushMicrotasks();

		expect(activeDuringRender).toBe(element);
		expect(activeDuringOnCreate).toBe(element);
		expect(getActiveComponent()).toBeNull();

		document.body.removeChild(element);
	});

	it('disconnectedCallback destroys all registered disposables and clears the cache', async () => {
		const destroyed: string[] = [];

		class DisposableProbeComponent {
			onCreate(): void {
				const active = getActiveComponent();
				active?.registerDisposable({ destroy: () => destroyed.push('a') });
				active?.registerDisposable({ destroy: () => destroyed.push('b') });
				active?.getSelectCache().set('test::key', { destroy: () => {} } as never);
			}
		}

		MelodicComponent({
			selector: 'test-disposable-probe',
			template: () => html`<div></div>`
		})(DisposableProbeComponent);

		const element = document.createElement('test-disposable-probe');
		document.body.appendChild(element);
		await flushMicrotasks();

		expect((element as { getSelectCache(): Map<string, unknown> }).getSelectCache().size).toBe(1);

		document.body.removeChild(element);

		expect(destroyed.sort()).toEqual(['a', 'b']);
		expect((element as { getSelectCache(): Map<string, unknown> }).getSelectCache().size).toBe(0);
	});

	it('user onDestroy runs before disposables are destroyed', async () => {
		const order: string[] = [];

		class OrderProbeComponent {
			onCreate(): void {
				const active = getActiveComponent();
				active?.registerDisposable({
					destroy: () => order.push('disposable')
				});
			}

			onDestroy(): void {
				order.push('onDestroy');
			}
		}

		MelodicComponent({
			selector: 'test-order-probe',
			template: () => html`<div></div>`
		})(OrderProbeComponent);

		const element = document.createElement('test-order-probe');
		document.body.appendChild(element);
		await flushMicrotasks();
		document.body.removeChild(element);

		expect(order).toEqual(['onDestroy', 'disposable']);
	});

	it('class-field initializers see the host component as active (no leak for field-init selects)', async () => {
		let activeDuringFieldInit: unknown = 'unset';
		const destroyed: string[] = [];

		class FieldInitProbeComponent {
			capturedActive = (() => {
				const active = getActiveComponent();
				activeDuringFieldInit = active;
				active?.registerDisposable({ destroy: () => destroyed.push('field-init') });
				return active;
			})();
		}

		MelodicComponent({
			selector: 'test-field-init-probe',
			template: () => html`<div></div>`
		})(FieldInitProbeComponent);

		const element = document.createElement('test-field-init-probe');
		document.body.appendChild(element);
		await flushMicrotasks();

		expect(activeDuringFieldInit).not.toBeNull();
		// The placeholder is a stand-in during Reflect.construct, NOT the eventual host element.
		// What matters: ComponentBase adopts the same Set, so the disposable is destroyed on disconnect.

		document.body.removeChild(element);
		expect(destroyed).toEqual(['field-init']);
	});

	it('restores prior active component after callback returns (re-entrancy)', async () => {
		let outerActiveDuringInner: unknown = 'unset';

		class OuterProbeComponent {
			onCreate(): void {
				const outerActive = getActiveComponent();
				// Synchronously mount an inner component while we're "active".
				const inner = document.createElement('test-inner-probe');
				this.appendChildSafely(inner);
				outerActiveDuringInner = getActiveComponent();
				expect(getActiveComponent()).toBe(outerActive);
			}

			private appendChildSafely(child: HTMLElement): void {
				const host = getActiveComponent();
				host?.shadowRoot?.appendChild(child);
			}
		}

		class InnerProbeComponent {}

		MelodicComponent({
			selector: 'test-inner-probe',
			template: () => html`<span></span>`
		})(InnerProbeComponent);

		MelodicComponent({
			selector: 'test-outer-probe',
			template: () => html`<div></div>`
		})(OuterProbeComponent);

		const element = document.createElement('test-outer-probe');
		document.body.appendChild(element);
		await flushMicrotasks();

		expect(outerActiveDuringInner).toBe(element);

		document.body.removeChild(element);
	});
});
