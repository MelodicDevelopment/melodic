import { isDevMode } from './dev-mode';

/**
 * In-page DevTools hook.
 *
 * The framework emits structured events through one global object, created
 * lazily in dev (or pre-installed by an extension's content script before page
 * scripts run). When nothing is listening, an emit costs one boolean check and
 * one null check — the registries stay empty until someone subscribes, so a
 * page with DevTools closed pays essentially nothing.
 */

export type HookEventType =
	| 'component:define'
	| 'component:create'
	| 'component:connect'
	| 'component:render'
	| 'component:disconnect'
	| 'component:destroy'
	| 'signal:create'
	| 'signal:set'
	| 'signal:destroy'
	| 'computed:recompute'
	| 'effect:run'
	| 'flush:start'
	| 'flush:end'
	| 'nav:start'
	| 'nav:end'
	| 'nav:blocked'
	| 'nav:error'
	| 'nav:redirect'
	| 'nav:superseded'
	| 'store:dispatch'
	| 'di:bind'
	| 'di:resolve';

export interface IHookEvent {
	type: HookEventType;
	/** `performance.now()` when the event was emitted. */
	ts: number;
	/** Event-specific payload. */
	payload?: Record<string, unknown>;
}

export interface IComponentRecord {
	id: number;
	selector: string;
	host: WeakRef<HTMLElement>;
	renders: number;
	lastRenderMs: number;
}

export interface IMelodicDevtoolsHook {
	version: string;
	emit(event: IHookEvent): void;
	on(type: HookEventType | '*', listener: (event: IHookEvent) => void): () => void;
	/** True once anything has subscribed — the framework's gate for extra work. */
	readonly listening: boolean;
	components: Map<number, IComponentRecord>;
	nextId(): number;
}

declare global {
	interface Window {
		__MELODIC_DEVTOOLS_HOOK__?: IMelodicDevtoolsHook;
	}
}

const HOOK_KEY = '__MELODIC_DEVTOOLS_HOOK__';

let hook: IMelodicDevtoolsHook | null | undefined;

function createHook(): IMelodicDevtoolsHook {
	const listeners = new Map<HookEventType | '*', Set<(event: IHookEvent) => void>>();
	let id = 0;
	let listening = false;

	const instance: IMelodicDevtoolsHook = {
		version: '1',
		components: new Map(),
		get listening(): boolean {
			return listening;
		},
		nextId: () => ++id,
		emit(event: IHookEvent): void {
			if (!listening) {
				return;
			}

			for (const listener of listeners.get(event.type) ?? []) {
				listener(event);
			}
			for (const listener of listeners.get('*') ?? []) {
				listener(event);
			}
		},
		on(type: HookEventType | '*', listener: (event: IHookEvent) => void): () => void {
			listening = true;

			let set = listeners.get(type);
			if (!set) {
				set = new Set();
				listeners.set(type, set);
			}
			set.add(listener);

			return () => {
				set!.delete(listener);
			};
		}
	};

	return instance;
}

/**
 * The hook, or `null` outside dev mode / outside a browser. Resolved once —
 * an extension that installs `window.__MELODIC_DEVTOOLS_HOOK__` before page
 * scripts run wins, which is how a DevTools panel captures the very first
 * component definition.
 */
export function getHook(): IMelodicDevtoolsHook | null {
	if (hook !== undefined) {
		return hook;
	}

	if (typeof window === 'undefined' || !isDevMode()) {
		hook = null;
		return hook;
	}

	hook = window[HOOK_KEY] ?? createHook();
	window[HOOK_KEY] = hook;

	return hook;
}

/**
 * Emit an event if a hook exists AND something is listening. The `payload`
 * is a thunk so building it costs nothing when DevTools is closed.
 */
export function emitDevtools(type: HookEventType, payload?: () => Record<string, unknown>): void {
	const active = getHook();

	if (!active || !active.listening) {
		return;
	}

	active.emit({ type, ts: typeof performance !== 'undefined' ? performance.now() : Date.now(), payload: payload?.() });
}

/** True when something is listening — gate expensive instrumentation on this. */
export function devtoolsListening(): boolean {
	const active = getHook();
	return active !== null && active.listening;
}

/** Reset the resolved hook (tests). */
export function resetHook(): void {
	hook = undefined;
	if (typeof window !== 'undefined') {
		delete window[HOOK_KEY];
	}
}
