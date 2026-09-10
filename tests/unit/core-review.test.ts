import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MelodicComponent } from '../../src/components/decorators/melodic-component.decorator';
import { html } from '../../src/template';
import { signal } from '../../src/signals';
import { repeat } from '../../src/template/directives/builtin/repeat.directive';
import { render } from '../../src/template/functions/render.function';
import { RouterService } from '../../src/routing/services/router.service';
import { RouteContextService } from '../../src/routing/services/route-context.service';
import { matchRouteTree } from '../../src/routing/functions/match-route-tree.function';
import { Injector } from '../../src/injection';
import { bootstrap } from '../../src/bootstrap';
import { provideHttp } from '../../src/http/functions/provide-http.function';
import { HttpClient } from '../../src/http/classes/http-client.class';
import { resolveEnvironment } from '../../src/config/environment';
import { setDevMode, resetDevWarnings } from '../../src/devtools/dev-mode';
import { flush, mount, unmountAll } from '../../src/testing';

let uid = 0;
const nextTag = (prefix: string): string => `${prefix}-${++uid}`;

afterEach(async () => {
	await unmountAll();
	setDevMode(null);
	resetDevWarnings();
});

/** R4 — an element re-attached after teardown came back inert. */
describe('re-attaching a destroyed element', () => {
	it('rebinds its handlers and renders again', async () => {
		const tag = nextTag('zombie');
		const clicks: number[] = [];

		class Host {
			public label = 'first';
			public elementRef!: HTMLElement;
			public handle = (): void => {
				clicks.push(1);
			};
		}
		MelodicComponent({
			selector: tag,
			template: (c: Host) => html`<button @click=${c.handle}>${c.label}</button>`
		})(Host as never);

		const element = await mount(tag);
		const parent = element.parentElement!;

		// Remove and let the DEFERRED teardown run, then re-attach.
		element.remove();
		await flush();
		parent.appendChild(element);
		await flush();

		const button = element.shadowRoot!.querySelector('button')!;
		button.click();

		expect(clicks).toHaveLength(1);
		expect(element.shadowRoot!.textContent).toContain('first');
	});
});

/** R13 — observed attributes were never validated. */
describe('observed attribute validation', () => {
	it('warns about an attribute name that can never fire', () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
		setDevMode(true);

		class Host {
			public myAttr = '';
			public elementRef!: HTMLElement;
		}
		MelodicComponent({ selector: nextTag('attr-case'), attributes: ['myAttr'], template: () => html`<i></i>` })(Host as never);

		expect(warn.mock.calls.some((call) => String(call[1]).includes('can never fire'))).toBe(true);
		warn.mockRestore();
	});

	it('warns when an observed attribute points at a method', () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
		setDevMode(true);

		class Host {
			public elementRef!: HTMLElement;
			public submit(): void {
				/* not a data property */
			}
		}
		MelodicComponent({ selector: nextTag('attr-method'), attributes: ['submit'], template: () => html`<i></i>` })(Host as never);

		expect(warn.mock.calls.some((call) => String(call[1]).includes('is a method'))).toBe(true);
		warn.mockRestore();
	});
});

/** D7 — a typed attributes map replaces `static propertyTypes`. */
describe('typed attributes map', () => {
	it('coerces by the declared type, with no initializer to infer from', async () => {
		const tag = nextTag('typed-attrs');

		class Host {
			public open?: boolean;
			public offset?: number;
			public label?: string;
			public elementRef!: HTMLElement;
		}
		MelodicComponent({
			selector: tag,
			attributes: { open: 'boolean', offset: 'number', label: 'string' },
			template: () => html`<i></i>`
		})(Host as never);

		const element = await mount<Host>(tag, {}, { attributes: { open: '', offset: '12', label: 'false' } });

		expect(element.component.open).toBe(true);
		expect(element.component.offset).toBe(12);
		// Declared string: "false" stays the string, not a boolean.
		expect(element.component.label).toBe('false');
	});

	it('exposes the same observed names as the list form', () => {
		const tag = nextTag('typed-observed');

		class Host {
			public elementRef!: HTMLElement;
		}
		MelodicComponent({ selector: tag, attributes: { open: 'boolean', size: 'string' }, template: () => html`<i></i>` })(Host as never);

		const observed = (customElements.get(tag) as unknown as { observedAttributes: string[] }).observedAttributes;
		expect(observed).toEqual(['open', 'size']);
	});
});

/** R15 — keyFn was called two or three times per item per render. */
describe('repeat() key computation', () => {
	it('calls keyFn once per item per render', () => {
		const container = document.createElement('div');
		document.body.appendChild(container);

		let calls = 0;
		const keyFn = (item: { id: number }): number => {
			calls++;
			return item.id;
		};
		const template = (items: { id: number }[]) => html`<ul>${repeat(items, keyFn, (item) => html`<li>${item.id}</li>`)}</ul>`;

		render(template([{ id: 1 }, { id: 2 }, { id: 3 }]), container);
		calls = 0;

		// A reorder takes the full reconciliation path, the one that used to
		// call keyFn again for the key map, the fast-path check and the diff.
		render(template([{ id: 3 }, { id: 1 }, { id: 2 }]), container);

		expect(calls).toBe(3);
		expect(container.querySelectorAll('li').length).toBe(3);
		container.remove();
	});

	it('warns about duplicate keys and still renders every item', () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
		setDevMode(true);
		const container = document.createElement('div');
		document.body.appendChild(container);

		const template = (ids: number[]) => html`<ul>${repeat(ids.map((id) => ({ id })), (item) => item.id, (item) => html`<li>${item.id}</li>`)}</ul>`;

		render(template([1, 2]), container);
		render(template([1, 1, 2]), container);

		expect(warn.mock.calls.some((call) => String(call[1]).includes('duplicate key'))).toBe(true);
		expect(container.querySelectorAll('li').length).toBe(3);

		// Shrinking back must remove every surplus item, not orphan one.
		render(template([1]), container);
		expect(container.querySelectorAll('li').length).toBe(1);

		container.remove();
		warn.mockRestore();
	});
});

/** S11 — a sibling outlet was mistaken for a parent. */
describe('router outlet nesting', () => {
	it('treats two outlets in one shadow root as siblings, both at depth 0', async () => {
		await import('../../src/routing/components/router-outlet/router-outlet.component');
		const tag = nextTag('two-outlets');

		class Host {
			public elementRef!: HTMLElement;
		}
		MelodicComponent({
			selector: tag,
			template: () => html`<router-outlet></router-outlet><router-outlet></router-outlet>`
		})(Host as never);

		const element = await mount(tag);
		const outlets = [...element.shadowRoot!.querySelectorAll('router-outlet')];

		expect(outlets).toHaveLength(2);
		for (const outlet of outlets) {
			expect((outlet as unknown as { component: { getDepth(): number } }).component.getDepth()).toBe(0);
		}
	});
});

/** S17 — route matchers were rebuilt for every route on every match. */
describe('route matcher caching', () => {
	it('produces identical results across repeated matches', () => {
		const routes = [
			{ path: 'users/:id', component: 'x-user' },
			{ path: 'about', component: 'x-about' }
		];

		const first = matchRouteTree(routes, '/users/7');
		const second = matchRouteTree(routes, '/users/9');

		expect(first.params.id).toBe('7');
		expect(second.params.id).toBe('9');
		expect(second.matches[0].route).toBe(routes[0]);
	});
});

/** S21 — bootstrap and config gaps. */
describe('bootstrap wiring', () => {
	beforeEach(() => {
		Injector.unbind('IMelodicApp');
	});

	it('populates IMelodicApp.http when an HTTP client is provided', async () => {
		const app = await bootstrap({ providers: [provideHttp({ baseURL: '/api' })] });

		expect(app.http).toBeInstanceOf(HttpClient);
		expect(app.http).toBe(Injector.get(HttpClient));
		app.destroy();
	});

	it('binds IMelodicApp before onReady runs', async () => {
		let resolvedInsideOnReady: unknown;

		const app = await bootstrap({
			onReady: () => {
				resolvedInsideOnReady = Injector.get('IMelodicApp');
			}
		});

		expect(resolvedInsideOnReady).toBe(app);
		app.destroy();
	});

	it('releases the binding when onReady throws', async () => {
		await expect(
			bootstrap({
				onReady: () => {
					throw new Error('startup failed');
				}
			})
		).rejects.toThrow('startup failed');

		expect(Injector.has('IMelodicApp')).toBe(false);
	});

	it('resolves the same RouteContextService the injector holds', () => {
		const router = new RouterService();
		try {
			expect(router.getContextService()).toBe(Injector.get(RouteContextService));
		} finally {
			router.destroy();
		}
	});
});

describe('environment resolution', () => {
	it('prefers an explicit VITE_ENV', () => {
		expect(resolveEnvironment({ VITE_ENV: 'qa', MODE: 'production', PROD: true })).toBe('qa');
	});

	it('honours a Vite MODE that names an environment', () => {
		// `vite build --mode qa` used to fall through to 'prod', so a QA build
		// quietly ran the production configuration.
		expect(resolveEnvironment({ MODE: 'qa' })).toBe('qa');
		expect(resolveEnvironment({ MODE: 'production', PROD: true })).toBe('prod');
		expect(resolveEnvironment({ MODE: 'development', DEV: true })).toBe('dev');
	});

	it('falls back to PROD, then to dev', () => {
		expect(resolveEnvironment({ MODE: 'staging', PROD: true })).toBe('prod');
		expect(resolveEnvironment({ MODE: 'staging' })).toBe('dev');
		expect(resolveEnvironment(undefined)).toBe('dev');
	});

	it('ignores a VITE_ENV that is not an environment name', () => {
		expect(resolveEnvironment({ VITE_ENV: 'nonsense', PROD: true })).toBe('prod');
	});
});

/** R14 — a rejected global stylesheet produced one unhandled rejection per component. */
describe('global styles', () => {
	it('keeps constructing components when a stylesheet cannot be read', async () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
		setDevMode(true);

		const link = document.createElement('link');
		link.rel = 'stylesheet';
		link.setAttribute('melodic-styles', '');
		link.href = 'https://example.invalid/theme.css';
		// Cross-origin sheets throw on `cssRules`; emulate that.
		Object.defineProperty(link, 'sheet', {
			get() {
				return {
					get cssRules(): never {
						throw new DOMException('Cannot access rules', 'SecurityError');
					}
				};
			}
		});
		document.head.appendChild(link);

		const rejections: unknown[] = [];
		const onRejection = (event: PromiseRejectionEvent): void => {
			rejections.push(event.reason);
		};
		window.addEventListener('unhandledrejection', onRejection);

		try {
			const tag = nextTag('styled');
			class Host {
				public elementRef!: HTMLElement;
			}
			MelodicComponent({ selector: tag, template: () => html`<i>ok</i>` })(Host as never);

			const first = await mount(tag);
			const second = await mount(tag);

			expect(first.shadowRoot!.textContent).toContain('ok');
			expect(second.shadowRoot!.textContent).toContain('ok');
			expect(rejections).toHaveLength(0);
		} finally {
			window.removeEventListener('unhandledrejection', onRejection);
			link.remove();
			warn.mockRestore();
		}
	});
});

/** The render effect must not outlive the component. */
describe('render effect lifetime', () => {
	it('is destroyed with the component', async () => {
		const source = signal(0);
		const tag = nextTag('effect-lifetime');
		let renders = 0;

		class Host {
			public elementRef!: HTMLElement;
			public onRender(): void {
				renders++;
			}
		}
		MelodicComponent({ selector: tag, template: () => html`<i>${source()}</i>` })(Host as never);

		const element = await mount(tag);
		element.remove();
		await flush();

		const before = renders;
		source.set(1);
		await flush();

		expect(renders).toBe(before);
	});
});
