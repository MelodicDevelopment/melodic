import { describe, it, expect, vi } from 'vitest';
import { signal, computed } from '../../src/signals';
import { MelodicComponent } from '../../src/components/decorators/melodic-component.decorator';
import { setActiveComponent } from '../../src/components/functions/active-component.functions';
import { html } from '../../src/template';
import { FormControl } from '../../src/forms/classes/form-control.class';
import { InjectionEngine, Injector } from '../../src/injection/classes/injection-engine.class';
import { bootstrap } from '../../src/bootstrap/functions/bootstrap.function';

/**
 * Regressions from the September 2026 review: resources must be owned by the
 * scope that created them and released even when user code throws or work
 * finishes after its owner is gone.
 */
describe('component ownership and teardown', () => {
	it('disposes owned resources even when onDestroy throws', () => {
		class ThrowingDestroy {
			public onDestroy() {
				throw new Error('user cleanup failed');
			}
		}
		MelodicComponent({ selector: 'lifetime-throwing-destroy', template: () => html`` })(ThrowingDestroy);

		const el = document.createElement('lifetime-throwing-destroy') as any;
		const cleanup = vi.fn();
		el.registerDisposable({ destroy: cleanup });

		expect(() => el.teardown()).toThrow('user cleanup failed');
		expect(cleanup).toHaveBeenCalledTimes(1);
	});

	it('still schedules teardown when onDisconnect throws', async () => {
		class ThrowingDisconnect {
			public onDisconnect() {
				throw new Error('disconnect failed');
			}
		}
		MelodicComponent({ selector: 'lifetime-throwing-disconnect', template: () => html`` })(ThrowingDisconnect);

		const el = document.createElement('lifetime-throwing-disconnect') as any;
		const cleanup = vi.fn();
		el.registerDisposable({ destroy: cleanup });
		document.body.appendChild(el);

		expect(() => el.remove()).toThrow('disconnect failed');
		await Promise.resolve();
		expect(cleanup).toHaveBeenCalledTimes(1);
	});

	it('owns resources created in onInit', () => {
		const source = signal(1);
		class InitScope {
			public derived: any;
			public onInit() {
				this.derived = computed(() => source() * 2);
			}
		}
		MelodicComponent({ selector: 'lifetime-init-scope', template: (c: InitScope) => html`${c.derived()}` })(InitScope);

		const el = document.createElement('lifetime-init-scope') as any;
		const derived = el.component.derived;
		expect(derived()).toBe(2);

		el.teardown();
		expect(() => derived()).toThrow(/destruction/);
	});

	it('does not register a child component\'s onInit resources with the parent', () => {
		const source = signal(1);
		const childDisposables: unknown[] = [];
		class ChildScope {
			public derived: any;
			public onInit() {
				this.derived = computed(() => source());
			}
		}
		MelodicComponent({ selector: 'lifetime-child-scope', template: () => html`` })(ChildScope);

		const parent = { registerDisposable: (d: unknown) => childDisposables.push(d), getSelectCache: () => new Map() };
		setActiveComponent(parent as any);
		let el: any;
		try {
			el = document.createElement('lifetime-child-scope');
		} finally {
			setActiveComponent(null);
		}

		expect(childDisposables).toHaveLength(0);
		el.teardown();
		expect(() => el.component.derived()).toThrow(/destruction/);
	});
});

describe('injector ownership', () => {
	it('does not register singleton factory resources with the requesting component', () => {
		const engine = new InjectionEngine();
		const registered: unknown[] = [];
		engine.bindFactory('factory', () => computed(() => 42), { singleton: true });

		setActiveComponent({ registerDisposable: (d: unknown) => registered.push(d) } as any);
		try {
			engine.get('factory');
		} finally {
			setActiveComponent(null);
		}

		expect(registered).toHaveLength(0);
	});
});

describe('form validation after destroy', () => {
	it('ignores async validation that settles after the control is destroyed', async () => {
		const control = new FormControl('x');
		let finish!: (value: null) => void;
		(control as any)._asyncValidators = [() => new Promise<null>((resolve) => { finish = resolve; })];

		const pending = control.validate();
		control.destroy();
		finish(null);

		await expect(pending).resolves.toBeUndefined();
	});

	it('records a rejecting async validator as an error instead of an unhandled rejection', async () => {
		const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
		try {
			const control = new FormControl('x');
			(control as any)._asyncValidators = [() => Promise.reject(new Error('lookup failed'))];

			await control.validate();

			expect(control.pending()).toBe(false);
			expect(control.hasError('asyncValidator')).toBe(true);
			expect(control.getError('asyncValidator')?.params?.message).toBe('lookup failed');
			control.destroy();
		} finally {
			spy.mockRestore();
		}
	});
});

describe('application lifetime', () => {
	it('releases the global app binding on destroy, idempotently', async () => {
		const app = await bootstrap();
		expect(Injector.has('IMelodicApp')).toBe(true);

		app.destroy();
		expect(Injector.has('IMelodicApp')).toBe(false);
		expect(() => app.destroy()).not.toThrow();
	});

	it('does not unbind a newer app when a stale handle is destroyed', async () => {
		const first = await bootstrap();
		const second = await bootstrap();

		first.destroy();
		expect(Injector.get('IMelodicApp')).toBe(second);
		second.destroy();
	});

	it('removes installed window error handlers when bootstrap fails', async () => {
		const add = vi.spyOn(window, 'addEventListener');
		const remove = vi.spyOn(window, 'removeEventListener');

		try {
			await expect(
				bootstrap({
					onError: () => {},
					onBefore: async () => {
						throw new Error('startup failed');
					}
				})
			).rejects.toThrow('startup failed');

			const handlers = add.mock.calls.filter(([type]) => type === 'error' || type === 'unhandledrejection');
			expect(handlers.length).toBe(2);
			for (const [type, listener] of handlers) {
				expect(remove).toHaveBeenCalledWith(type, listener);
			}
		} finally {
			add.mockRestore();
			remove.mockRestore();
		}
	});

	it('unmounts a root component when a later bootstrap step fails', async () => {
		class Root {}
		MelodicComponent({ selector: 'lifetime-root', template: () => html`` })(Root);
		const target = document.createElement('div');
		document.body.appendChild(target);

		try {
			await expect(
				bootstrap({
					rootComponent: 'lifetime-root',
					target,
					onReady: () => {
						throw new Error('ready failed');
					}
				})
			).rejects.toThrow('ready failed');

			expect(target.querySelector('lifetime-root')).toBeNull();
			expect(Injector.has('IMelodicApp')).toBe(false);
		} finally {
			target.remove();
		}
	});
});

describe('bulk form writes', () => {
	it('emit one aggregate value notification per FormGroup.setValue', async () => {
		const { FormGroup } = await import('../../src/forms/classes/form-group.class');
		const controls = Object.fromEntries(Array.from({ length: 100 }, (_, i) => [String(i), new FormControl(0)]));
		const group = new FormGroup(controls);
		const observer = vi.fn();
		group.value.subscribe(observer);

		group.setValue(Object.fromEntries(Array.from({ length: 100 }, (_, i) => [String(i), 1])));

		expect(observer).toHaveBeenCalledTimes(1);
		expect(group.value()['5']).toBe(1);
		group.destroy();
	});

	it('emit one aggregate value notification per FormArray.patchValue and reset', async () => {
		const { FormArray } = await import('../../src/forms/classes/form-array.class');
		const array = new FormArray(Array.from({ length: 50 }, () => new FormControl(0)));
		const observer = vi.fn();
		array.value.subscribe(observer);

		array.patchValue(Array.from({ length: 50 }, () => 2));
		expect(observer).toHaveBeenCalledTimes(1);

		array.reset();
		expect(observer).toHaveBeenCalledTimes(2);
		expect(array.value()).toEqual(Array.from({ length: 50 }, () => 0));
		array.destroy();
	});
});
