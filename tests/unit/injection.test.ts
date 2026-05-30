import { describe, it, expect } from 'vitest';
import { Injector, createToken, Inject } from '../../src/injection';
import { MelodicComponent } from '../../src/components/decorators/melodic-component.decorator';
import { html } from '../../src/template';

function flushMicrotasks(): Promise<void> {
	return new Promise((resolve) => queueMicrotask(resolve));
}

describe('dependency injection', () => {
	it('keeps tokens distinct by identity even when they share a description', () => {
		const tokenA = createToken<string>('shared-description');
		const tokenB = createToken<string>('shared-description');

		Injector.bindValue(tokenA, 'value-A');
		Injector.bindValue(tokenB, 'value-B');

		// Before the identity fix both collapsed to the string "Symbol(shared-description)"
		// and the second bind silently overwrote the first.
		expect(Injector.get(tokenA)).toBe('value-A');
		expect(Injector.get(tokenB)).toBe('value-B');
	});

	it('resolves constructor @Inject dependencies via the engine', () => {
		const token = createToken<{ name: string }>('engine-inject-svc');
		Injector.bindValue(token, { name: 'injected' });

		class EngineConsumer {
			constructor(public dep: { name: string }) {}
		}
		// Apply the parameter decorator manually (no TS param-decorator syntax in test).
		Inject(token)(EngineConsumer, undefined, 0);

		Injector.bind(EngineConsumer);
		const instance = Injector.get(EngineConsumer);

		expect(instance.dep).toEqual({ name: 'injected' });
	});

	it('resolves constructor @Inject dependencies in a component', async () => {
		const configToken = createToken<{ api: string }>('component-inject-cfg');
		Injector.bindValue(configToken, { api: '/data' });

		class InjectHostComponent {
			constructor(public config: { api: string }) {}
		}
		Inject(configToken)(InjectHostComponent, undefined, 0);

		MelodicComponent({
			selector: 'test-inject-host',
			template: (component: InjectHostComponent) => html`<span>${component.config.api}</span>`
		})(InjectHostComponent);

		const element = document.createElement('test-inject-host');
		document.body.appendChild(element);
		await flushMicrotasks();

		// Was `undefined` before the for...of bug fix in the component decorator.
		expect(element.shadowRoot?.textContent).toContain('/data');

		document.body.removeChild(element);
	});

	it('throws a readable error for a missing dependency', () => {
		const missing = createToken<string>('never-bound-token');
		expect(() => Injector.get(missing)).toThrow(/never-bound-token/);
	});
});
