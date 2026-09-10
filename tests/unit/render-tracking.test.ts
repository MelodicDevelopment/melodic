import { describe, it, expect, vi, afterEach } from 'vitest';
import { MelodicComponent } from '../../src/components/decorators/melodic-component.decorator';
import { html } from '../../src/template';
import { signal, computed, effect, untracked, batch, SignalEffect } from '../../src/signals';
import { setDevMode, resetDevWarnings } from '../../src/devtools/dev-mode';

const flush = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

let uid = 0;
const nextTag = (prefix: string): string => `${prefix}-${++uid}`;

afterEach(() => {
	setDevMode(null);
	resetDevWarnings();
});

/**
 * R2 — the single largest usability gap in the review: a template that read a
 * signal from anywhere other than a component *field* never re-rendered.
 */
describe('render-time signal tracking', () => {
	it('re-renders when a signal read from a service changes', async () => {
		const service = { user: signal('ada') };
		const tag = nextTag('track-service');

		class Host {
			public elementRef!: HTMLElement;
		}
		MelodicComponent({ selector: tag, template: () => html`<p>${service.user()}</p>` })(Host as never);

		const element = document.createElement(tag);
		document.body.appendChild(element);
		await flush();

		expect(element.shadowRoot!.textContent).toContain('ada');

		service.user.set('grace');
		await flush();

		expect(element.shadowRoot!.textContent).toContain('grace');
		element.remove();
	});

	it('re-renders when a signal nested inside a plain object changes', async () => {
		const state = { counters: [signal(1)] };
		const tag = nextTag('track-nested');

		class Host {
			public elementRef!: HTMLElement;
		}
		MelodicComponent({ selector: tag, template: () => html`<p>${state.counters[0]()}</p>` })(Host as never);

		const element = document.createElement(tag);
		document.body.appendChild(element);
		await flush();
		expect(element.shadowRoot!.textContent).toContain('1');

		state.counters[0].set(42);
		await flush();
		expect(element.shadowRoot!.textContent).toContain('42');
		element.remove();
	});

	it('stops tracking once the component is destroyed', async () => {
		const source = signal(0);
		const tag = nextTag('track-destroy');
		let renders = 0;

		class Host {
			public elementRef!: HTMLElement;
			public onRender(): void {
				renders++;
			}
		}
		MelodicComponent({ selector: tag, template: () => html`<p>${source()}</p>` })(Host as never);

		const element = document.createElement(tag);
		document.body.appendChild(element);
		await flush();
		const rendersWhileMounted = renders;

		element.remove();
		await flush();

		source.set(1);
		await flush();

		expect(renders).toBe(rendersWhileMounted);
	});

	it('does not track a child component’s own signals in its parent', async () => {
		const childState = signal(0);
		let parentRenders = 0;

		class TrackChild {
			public elementRef!: HTMLElement;
			public count = childState;
			public onCreate(): void {
				// A hook that reads a signal must not subscribe the PARENT's
				// render effect, which is active while this element upgrades.
				void this.count();
			}
		}
		MelodicComponent({ selector: 'track-fixed-child', template: (c: TrackChild) => html`<span>${c.count()}</span>` })(TrackChild as never);

		class TrackParent {
			public elementRef!: HTMLElement;
			public onRender(): void {
				parentRenders++;
			}
		}
		MelodicComponent({ selector: 'track-fixed-parent', template: () => html`<div><track-fixed-child></track-fixed-child></div>` })(TrackParent as never);

		const element = document.createElement('track-fixed-parent');
		document.body.appendChild(element);
		await flush();

		expect(element.shadowRoot!.querySelector('track-fixed-child')).not.toBeNull();

		const before = parentRenders;
		childState.set(5);
		await flush();

		expect(parentRenders).toBe(before);
		expect(element.shadowRoot!.querySelector('track-fixed-child')!.shadowRoot!.textContent).toContain('5');
		element.remove();
	});
});

/** R3 — every component used to render twice on mount. */
describe('mount renders', () => {
	it('renders once on mount', async () => {
		const tag = nextTag('single-render');
		let renders = 0;

		class Host {
			public label = 'hello';
			public elementRef!: HTMLElement;
			public onRender(): void {
				renders++;
			}
		}
		MelodicComponent({ selector: tag, template: (c: Host) => html`<p>${c.label}</p>`, attributes: ['label'] })(Host as never);

		const element = document.createElement(tag);
		element.setAttribute('label', 'from-attribute');
		document.body.appendChild(element);
		await flush();

		expect(renders).toBe(1);
		expect(element.shadowRoot!.textContent).toContain('from-attribute');
		element.remove();
	});
});

/** R11 — a property written from onRender used to spin forever. */
describe('render loop guard', () => {
	it('stops a component that re-renders itself without yielding', async () => {
		const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
		const tag = nextTag('render-loop');
		let renders = 0;

		class Host {
			public count = 0;
			public elementRef!: HTMLElement;
			public onRender(): void {
				renders++;
				this.count = this.count + 1;
			}
		}
		MelodicComponent({ selector: tag, template: (c: Host) => html`<p>${c.count}</p>` })(Host as never);

		const element = document.createElement(tag);
		document.body.appendChild(element);
		await flush();

		expect(renders).toBeLessThanOrEqual(30);
		expect(errorSpy).toHaveBeenCalled();
		expect(String(errorSpy.mock.calls[0][0])).toContain('render loop');

		element.remove();
		errorSpy.mockRestore();
	});
});

/** R10 — a field named like a native element property broke the platform behaviour. */
describe('native property collisions', () => {
	it('keeps the native property and warns', async () => {
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
		setDevMode(true);
		const tag = nextTag('native-clash');

		class Host {
			public hidden = false;
			public elementRef!: HTMLElement;
		}
		MelodicComponent({ selector: tag, template: () => html`<p>x</p>` })(Host as never);

		const element = document.createElement(tag);
		document.body.appendChild(element);
		await flush();

		element.setAttribute('hidden', '');
		expect((element as HTMLElement).hidden).toBe(true);
		expect(warnSpy).toHaveBeenCalled();

		element.remove();
		warnSpy.mockRestore();
	});
});

/** R12 — an effect created inside a batch used to defer its first run. */
describe('effect()', () => {
	it('runs immediately, even inside a batch', () => {
		const source = signal(1);
		let seen: number | null = null;

		batch(() => {
			source.set(2);
			effect(() => {
				seen = source();
			});
			// The body must already have run by the time the next statement runs.
			expect(seen).toBe(2);
		});

		expect(seen).toBe(2);
	});

	it('re-runs when a tracked source changes, and runs cleanups', () => {
		const source = signal(1);
		const cleanups: number[] = [];
		const runs: number[] = [];

		const ref = effect(() => {
			const value = source();
			runs.push(value);
			return () => cleanups.push(value);
		});

		source.set(2);
		expect(runs).toEqual([1, 2]);
		expect(cleanups).toEqual([1]);

		ref.destroy();
		expect(cleanups).toEqual([1, 2]);

		source.set(3);
		expect(runs).toEqual([1, 2]);
		expect(ref.destroyed).toBe(true);
	});

	it('SignalEffect.run() executes its first run synchronously inside a flush', () => {
		const source = signal(0);
		let ran = false;

		const outer = new SignalEffect(() => {
			source();
		});
		outer.run();

		batch(() => {
			source.set(1);
			const inner = new SignalEffect(() => {
				ran = true;
			});
			inner.run();
			expect(ran).toBe(true);
		});
	});
});

describe('untracked()', () => {
	it('reads without subscribing the surrounding effect', () => {
		const tracked = signal(0);
		const hidden = signal(0);
		let runs = 0;

		effect(() => {
			tracked();
			untracked(() => hidden());
			runs++;
		});

		expect(runs).toBe(1);

		hidden.set(1);
		expect(runs).toBe(1);

		tracked.set(1);
		expect(runs).toBe(2);
	});
});

/** R9 — a computed created during a render accumulates one copy per render. */
describe('computed created during render', () => {
	it('warns in dev mode', async () => {
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
		setDevMode(true);
		const tag = nextTag('computed-in-render');
		const source = signal(1);

		class Host {
			public elementRef!: HTMLElement;
			public get doubled(): number {
				return computed(() => source() * 2)();
			}
		}
		MelodicComponent({ selector: tag, template: (c: Host) => html`<p>${c.doubled}</p>` })(Host as never);

		const element = document.createElement(tag);
		document.body.appendChild(element);
		await flush();

		expect(warnSpy.mock.calls.some((call) => String(call[1]).includes('was created while'))).toBe(true);

		element.remove();
		warnSpy.mockRestore();
	});
});
