import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MelodicComponent } from '../../src/components/decorators/melodic-component.decorator';
import { emit } from '../../src/components/functions/emit.function';
import { getComponentDefinitions } from '../../src/components/functions/component-registry.functions';
import { html } from '../../src/template';
import { signal } from '../../src/signals';
import { Injectable, Injector, Service, createToken } from '../../src/injection';
import { inject, injectOptional } from '../../src/injection/function/inject.function';
import { mount, flush, query, text, unmountAll, captureEvents } from '../../src/testing';
import { getHook, resetHook } from '../../src/devtools/hook';
import { setDevMode } from '../../src/devtools/dev-mode';

class CounterComponent {
	public count = 0;
	public elementRef!: HTMLElement;

	public increment(): void {
		this.count = this.count + 1;
		emit(this.elementRef, 'ml:count', { count: this.count });
	}
}
MelodicComponent({
	selector: 'dx-counter',
	template: (c: CounterComponent) => html`<button @click=${() => c.increment()}>${c.count}</button>`
})(CounterComponent as never);

describe('@melodicdev/core/testing', () => {
	afterEach(async () => {
		await unmountAll();
	});

	it('mounts a component with properties and waits for its first render', async () => {
		const element = await mount<CounterComponent>('dx-counter', { count: 3 });

		expect(text(element)).toBe('3');
		expect(element.component.count).toBe(3);
	});

	it('queries the shadow root and flushes updates', async () => {
		const element = await mount<CounterComponent>('dx-counter');

		query<HTMLButtonElement>(element, 'button')!.click();
		await flush();

		expect(text(element)).toBe('1');
	});

	it('unmounts and lets teardown run', async () => {
		const element = await mount<CounterComponent>('dx-counter');
		await element.unmount();

		expect(element.isConnected).toBe(false);
	});

	it('rejects an unregistered selector with a useful message', async () => {
		await expect(mount('dx-not-registered')).rejects.toThrow(/no component is registered/);
	});
});

describe('emit()', () => {
	afterEach(async () => {
		await unmountAll();
	});

	it('dispatches a composed, bubbling CustomEvent by default', async () => {
		const element = await mount<CounterComponent>('dx-counter');
		const captured = captureEvents<{ count: number }>(document.body, 'ml:count');

		query<HTMLButtonElement>(element, 'button')!.click();
		await flush();

		const events = captured();
		expect(events).toHaveLength(1);
		expect(events[0].detail.count).toBe(1);
		expect(events[0].composed).toBe(true);
		expect(events[0].bubbles).toBe(true);
	});

	it('honours explicit options and reports preventDefault', () => {
		const target = document.createElement('div');
		target.addEventListener('ml:cancelable', (event) => event.preventDefault());

		expect(emit(target, 'ml:cancelable', null, { cancelable: true })).toBe(false);
		expect(emit(target, 'ml:other', null, { cancelable: true })).toBe(true);
	});
});

describe('inject()', () => {
	class Logger {
		public lines: string[] = [];
	}
	Injectable()(Logger);

	const MISSING = createToken<string>('dx-missing');

	it('resolves a bound token', () => {
		expect(inject(Logger)).toBeInstanceOf(Logger);
	});

	it('returns undefined (or a fallback) for an unbound token', () => {
		expect(injectOptional(MISSING)).toBeUndefined();
		expect(injectOptional(MISSING, 'fallback')).toBe('fallback');
	});

	it('lets a test replace a @Service field with a fake', () => {
		class Consumer {
			@Service(Logger) public logger!: Logger;
		}

		const consumer = new Consumer();
		const fake = new Logger();
		consumer.logger = fake;

		expect(consumer.logger).toBe(fake);
	});
});

describe('component registry', () => {
	it('lists every registered component', () => {
		expect(getComponentDefinitions().map((entry) => entry.selector)).toContain('dx-counter');
	});
});

describe('devtools hook', () => {
	beforeEach(() => {
		setDevMode(true);
		resetHook();
	});

	afterEach(async () => {
		await unmountAll();
		resetHook();
		setDevMode(null);
	});

	it('stays inert until something subscribes', () => {
		const hook = getHook();
		expect(hook).not.toBeNull();
		expect(hook!.listening).toBe(false);
	});

	it('reports component renders once a listener attaches', async () => {
		const hook = getHook()!;
		const seen: string[] = [];
		hook.on('component:render', (event) => seen.push(String(event.payload?.selector)));

		const element = await mount<CounterComponent>('dx-counter');
		query<HTMLButtonElement>(element, 'button')!.click();
		await flush();

		expect(seen).toContain('dx-counter');
		const record = [...hook.components.values()].find((entry) => entry.selector === 'dx-counter');
		expect(record?.renders).toBeGreaterThan(0);
	});

	it('reports signal writes', () => {
		const hook = getHook()!;
		const values: unknown[] = [];
		hook.on('signal:set', (event) => values.push(event.payload?.value));

		const source = signal(0, { name: 'dx-signal' });
		source.set(7);

		expect(values).toContain(7);
	});
});

describe('injector rebind warning', () => {
	let warnSpy: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		setDevMode(true);
		warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
	});

	afterEach(() => {
		warnSpy.mockRestore();
		setDevMode(null);
	});

	it('warns when a resolved singleton is re-bound', () => {
		const token = createToken<{ id: number }>('dx-rebind');
		Injector.bindValue(token, { id: 1 });
		Injector.get(token);

		Injector.bindValue(token, { id: 2 });

		expect(warnSpy.mock.calls.some((call) => String(call[1]).includes('re-bound'))).toBe(true);
		Injector.unbind(token);
	});
});
