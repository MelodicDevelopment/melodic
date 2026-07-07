import { describe, it, expect } from 'vitest';
import { Injector, createToken, Inject, Service } from '../../src/injection';
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

	it('@Inject on a subclass does not mutate the parent class metadata', () => {
		const tokenA = createToken<string>('inject-meta-a');
		const tokenB = createToken<string>('inject-meta-b');
		Injector.bindValue(tokenA, 'A');
		Injector.bindValue(tokenB, 'B');

		class Parent {
			constructor(public a?: string) {}
		}
		Inject(tokenA)(Parent, undefined, 0);

		class Child extends Parent {
			constructor(a?: string, public b?: string) {
				super(a);
			}
		}
		// Decorating the child previously wrote into the PARENT's params array
		// (found via the constructor prototype chain).
		Inject(tokenB)(Child, undefined, 1);

		const parentParams = (Parent as unknown as { params: unknown[] }).params;
		const childParams = (Child as unknown as { params: unknown[] }).params;

		expect(parentParams).toHaveLength(1);
		expect(childParams).toHaveLength(2);
		expect(childParams).not.toBe(parentParams);

		// The child still inherits the parent's position-0 token (copy-on-write).
		Injector.bind(Parent);
		Injector.bind(Child);
		const parent = Injector.get(Parent);
		const child = Injector.get(Child);
		expect(parent.a).toBe('A');
		expect(child.a).toBe('A');
		expect(child.b).toBe('B');
	});

	it('@Service caches falsy resolutions instead of re-resolving every access', () => {
		const flagToken = createToken<boolean>('falsy-service-flag');
		let resolutions = 0;
		Injector.bindFactory(flagToken, () => {
			resolutions++;
			return false;
		}, { singleton: false });

		class Consumer {
			flag!: boolean;
		}
		Service(flagToken)(Consumer.prototype, 'flag');

		const consumer = new Consumer();
		expect(consumer.flag).toBe(false);
		expect(consumer.flag).toBe(false);
		expect(consumer.flag).toBe(false);

		// Before the sentinel fix the truthiness check re-resolved on each read.
		expect(resolutions).toBe(1);
	});

	it('@Service caches per instance, not per prototype', () => {
		const counterToken = createToken<number>('per-instance-counter');
		let next = 0;
		Injector.bindFactory(counterToken, () => ++next, { singleton: false });

		class Consumer {
			value!: number;
		}
		Service(counterToken)(Consumer.prototype, 'value');

		const first = new Consumer();
		const second = new Consumer();

		expect(first.value).toBe(1);
		expect(first.value).toBe(1);
		expect(second.value).toBe(2);
		expect(second.value).toBe(2);
	});
});
