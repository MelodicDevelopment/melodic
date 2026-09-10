import { Injector } from '../injection/classes/injection-engine.class';
import { describeToken } from '../injection/function/get-token-key.function';
import { getComponentDefinitions } from '../components/functions/component-registry.functions';
import type { ComponentBase } from '../components/classes/component-base.class';
import { getHook, type IHookEvent } from './hook';
import { isDevMode } from './dev-mode';

/**
 * `window.melodic` — the console half of DevTools.
 *
 * A Chrome panel is a lot of surface for a framework this size, so stage one is
 * a console API that answers the questions a panel would: what is registered,
 * what is mounted, what did that element render from, what is in the injector,
 * where is the router, what has the store been told.
 */

export interface IComponentInspection {
	selector: string;
	element: HTMLElement;
	/** Reactive data properties and their current values. */
	properties: Record<string, unknown>;
	/** Fields holding a signal or a form control. */
	sources: string[];
	rendering: boolean;
}

export interface IMelodicConsoleApi {
	/** Every registered component selector. */
	components(): string[];
	/** Mounted instances of `selector` (or of everything, when omitted). */
	instances(selector?: string): HTMLElement[];
	/** What a mounted element is made of. */
	inspect(element: Element): IComponentInspection | null;
	/** Injector contents. */
	bindings(): Array<{ token: string; type: string; singleton: boolean; resolved: boolean }>;
	/** Subscribe to the framework event stream; returns an unsubscribe function. */
	on(type: Parameters<NonNullable<ReturnType<typeof getHook>>['on']>[0], listener: (event: IHookEvent) => void): () => void;
	/** Log every framework event until the returned function is called. */
	trace(): () => void;
}

function collectInstances(root: Document | ShadowRoot, selector: string | undefined, found: HTMLElement[]): void {
	for (const element of root.querySelectorAll<HTMLElement>('*')) {
		const tag = element.tagName.toLowerCase();

		if (tag.includes('-') && (selector === undefined || tag === selector)) {
			found.push(element);
		}

		if (element.shadowRoot) {
			collectInstances(element.shadowRoot, selector, found);
		}
	}
}

function isComponentElement(element: Element): element is HTMLElement & ComponentBase {
	return 'component' in element && (element as { component?: unknown }).component !== undefined;
}

export function createConsoleApi(): IMelodicConsoleApi {
	return {
		components: () => getComponentDefinitions().map((entry) => entry.selector),

		instances: (selector?: string) => {
			const found: HTMLElement[] = [];
			collectInstances(document, selector?.toLowerCase(), found);
			return found.filter(isComponentElement);
		},

		inspect: (element: Element) => {
			if (!isComponentElement(element)) {
				return null;
			}

			const base = element as unknown as ComponentBase;
			const component = base.component as Record<string, unknown>;
			const properties: Record<string, unknown> = {};
			const sources: string[] = [];

			for (const key of Object.keys(component)) {
				if (key.startsWith('_') || key === 'elementRef') {
					continue;
				}

				const value = component[key];
				if (typeof value === 'function' && '__signal' in (value as object)) {
					sources.push(key);
					continue;
				}
				if (typeof value === 'function') {
					continue;
				}
				properties[key] = value;
			}

			return {
				selector: base.selector,
				element: element as HTMLElement,
				properties,
				sources,
				rendering: base.isRendering
			};
		},

		bindings: () =>
			Injector.entries().map(([key, binding]) => ({
				token: describeToken(key),
				type: binding.type,
				singleton: binding.isSingleton,
				resolved: binding.getInstance() !== undefined
			})),

		on: (type, listener) => getHook()?.on(type, listener) ?? (() => undefined),

		trace: () => {
			const hook = getHook();
			if (!hook) {
				return () => undefined;
			}

			return hook.on('*', (event) => {
				console.log(`%c${event.type}`, 'color:#7c3aed;font-weight:600', event.payload ?? '');
			});
		}
	};
}

/**
 * Install `window.melodic` in dev. Called from `bootstrap()`; safe to call more
 * than once and a no-op in production builds.
 */
export function installConsoleApi(): void {
	if (typeof window === 'undefined' || !isDevMode()) {
		return;
	}

	const target = window as unknown as Record<string, unknown>;
	if (target.melodic) {
		return;
	}

	target.melodic = createConsoleApi();
}
