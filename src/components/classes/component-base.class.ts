import type { ComponentMeta } from '../types/component-meta.type';
import { attributeNames, attributeTypes } from '../types/component-meta.type';
import type { Component } from '../types/component.type';
import { render } from '../../template/functions/render.function';
import type { Unsubscriber } from '../../signals/types/unsubscriber.type';
import type { Signal } from '../../signals/types/signal.type';
import { isSignal } from '../../signals/functions/is-signal.function';
import type { IRenderedContainer } from '../../template/interfaces/irendered-container.interface';
import { disposeParts } from '../../template/functions/dispose.functions';
import { applyGlobalStyles, getGlobalStyleSheets, getGlobalStyleTexts } from '../styles/apply-global-styles.function';
import {
	getComponentStyleSheet,
	getComponentStyleText,
	getStyleSheetsForDocument,
	supportsConstructedStyleSheets
} from '../styles/component-style-sheets.function';
import { AbstractControl } from '../../forms/classes/abstract-control.class';
import { getActiveComponent, setActiveComponent } from '../functions/active-component.functions';
import { SignalEffect } from '../../signals/classes/signal-effect.class';
import { untracked } from '../../signals/functions/untracked.function';
import { devWarn, isDevMode } from '../../devtools/dev-mode';
import { devtoolsListening, emitDevtools, getHook } from '../../devtools/hook';

/**
 * Renders allowed for one component within a single macrotask before the
 * framework calls it a loop. A property write inside `onRender` re-renders
 * through a microtask, which re-runs `onRender`, forever — with no stack
 * overflow and no error, just a wedged tab.
 */
const MAX_RENDERS_PER_TASK = 25;

/**
 * A counter that advances once per macrotask in which any component rendered.
 *
 * The render-loop guard counts renders "within one task". Each component used
 * to arm its own `setTimeout(0)` to find the task boundary — one timer and one
 * closure per component per burst, so mounting a 1,000-row list scheduled
 * 1,000 timers. One shared timer answers the same question for all of them.
 */
let renderTaskEpoch = 0;
let renderTaskEpochArmed = false;

function currentRenderTaskEpoch(): number {
	if (!renderTaskEpochArmed) {
		renderTaskEpochArmed = true;
		setTimeout(() => {
			renderTaskEpochArmed = false;
			renderTaskEpoch++;
		}, 0);
	}

	return renderTaskEpoch;
}

/** kebab-case attribute name → camelCase property name, computed once per name. */
const attributePropertyNames = new Map<string, string>();

function attributeToProperty(attribute: string): string {
	let prop = attributePropertyNames.get(attribute);
	if (prop === undefined) {
		prop = attribute.replace(/-([a-z])/g, (_, ch: string) => ch.toUpperCase());
		attributePropertyNames.set(attribute, prop);
	}

	return prop;
}

/** Declared attribute coercion types per component definition, resolved once. */
const declaredTypeCache = new WeakMap<ComponentMeta, Array<[prop: string, type: PropertyType]>>();

/** `name in HTMLElement.prototype`, cached — the answer never changes for a name. */
const nativePropertyNames = new Map<string, boolean>();

function isNativeElementProperty(prop: string): boolean {
	let native = nativePropertyNames.get(prop);
	if (native === undefined) {
		native = prop in HTMLElement.prototype;
		nativePropertyNames.set(prop, native);
	}

	return native;
}

export interface PendingComponentScope {
	disposables: Set<{ destroy(): void }>;
	selectCache: Map<string, Signal<unknown>>;
}

/** Attribute coercion types a component may declare via `static propertyTypes`. */
export type PropertyType = 'boolean' | 'number' | 'string';

/**
 * A reactive source property (a component field holding a Signal or an
 * AbstractControl). Tracks the signals to (re)subscribe on connect and the
 * live unsubscribers, so the subscription can follow a reassignment of the
 * field (e.g. `this.form = createFormGroup(...)`).
 */
interface ReactiveSourceEntry {
	signals: Array<Signal<unknown>>;
	unsubscribers: Array<Unsubscriber>;
}

export abstract class ComponentBase extends HTMLElement {
	private readonly _meta: ComponentMeta;
	private readonly _component: Component;
	private readonly _root: ShadowRoot;
	// Fallback per-instance <style> element — only used when shared constructed
	// stylesheets are unavailable (see renderStyles()).
	private _style: HTMLStyleElement | null;
	private _renderScheduled = false;
	private readonly _booleanProperties: Set<string> = new Set();
	private readonly _numberProperties: Set<string> = new Set();
	private readonly _stringProperties: Set<string> = new Set();
	private readonly _disposables: Set<{ destroy(): void }>;
	private readonly _selectCache: Map<string, Signal<unknown>>;
	private _rendering = false;
	private _selectEpoch = 0;
	// Cache keys of select() entries created during a render pass, tagged with
	// the epoch of the last render that used them (see sweepRenderScopedSelects).
	private readonly _renderScopedSelects: Map<string, number> = new Map();

	// Reactive signal/control sources discovered during observe(). Subscribed on
	// every connect and torn down on every disconnect, so reactivity survives the
	// element being moved in the DOM. Entries are swapped in place when the
	// component reassigns a source field, so reactivity follows reassignment.
	private readonly _reactiveSourceEntries: Array<ReactiveSourceEntry> = [];

	private _created = false;
	private _destroyed = false;
	private _teardownScheduled = false;
	// Set by scheduleRender(), cleared by render(): the queued microtask skips
	// when a synchronous render already happened (every component used to
	// render twice on mount).
	private _dirty = true;
	// The template runs inside this effect, so ANY signal read while rendering
	// — a service's signal, a signal inside an object or array — schedules the
	// next render. Component fields holding signals remain wired separately as
	// a fallback for reads that happen outside the template.
	private _renderEffect: SignalEffect | null = null;
	private _rendersThisTask = 0;
	// The shared task epoch `_rendersThisTask` was counted in.
	private _renderTaskEpoch = -1;
	// Pending recovery timer after the render-loop guard tripped (rare).
	private _renderBurstReset: ReturnType<typeof setTimeout> | null = null;
	private _renderLoopReported = false;
	// True while the single catch-up render granted after a trip is running;
	// a trip during it is a real loop and gets no second chance.
	private _renderCatchingUp = false;
	// Teardown destroyed resources this component owned (computeds, effects,
	// forms). They cannot be recreated if the element is attached again.
	private _ownedResourcesDestroyed = false;
	private _onDestroyRan = false;
	/** DevTools id, assigned only when something is listening. */
	private _devtoolsId = 0;
	private _renderCount = 0;

	constructor(meta: ComponentMeta, component: Component, pending?: PendingComponentScope) {
		super();

		this._meta = meta;
		this._component = component;
		this._component.elementRef = this;

		// Components may declare attribute→property coercion types explicitly for
		// properties whose initial value doesn't reveal the type (e.g. `open?: boolean`):
		//   static propertyTypes = { open: 'boolean', offset: 'number' };
		// Resolved once per component definition rather than per instance.
		let declaredTypes = declaredTypeCache.get(meta);
		if (!declaredTypes) {
			declaredTypes = Object.entries({
				// `attributes: { open: 'boolean' }` is the preferred form; the older
				// `static propertyTypes` still works and wins on conflict.
				...attributeTypes(meta.attributes),
				...((component.constructor as { propertyTypes?: Record<string, PropertyType> }).propertyTypes ?? {})
			}).map(([attribute, type]): [string, PropertyType] => [attributeToProperty(attribute), type]);
			declaredTypeCache.set(meta, declaredTypes);
		}
		for (const [prop, type] of declaredTypes) {
			if (type === 'boolean') this._booleanProperties.add(prop);
			else if (type === 'number') this._numberProperties.add(prop);
			else if (type === 'string') this._stringProperties.add(prop);
		}
		// Adopt the same Set/Map the decorator used during Reflect.construct so
		// disposables and cache entries from class-field initializers belong to us.
		this._disposables = pending?.disposables ?? new Set();
		this._selectCache = pending?.selectCache ?? new Map();
		this._root = this.attachShadow({ mode: 'open' });
		applyGlobalStyles(this._root);
		this._style = this.renderStyles();

		// Property observation and onInit run inside this component's ownership
		// scope so resources created there (computeds, forms, selects) are
		// disposed with the component — not left alive, and not registered with
		// whichever parent component happened to be constructing us.
		const prevActive = getActiveComponent();
		setActiveComponent(this);
		try {
			// untracked: a parent's render effect is active while this element
			// is being upgraded inside the parent's template. Signals read in
			// observe()/onInit belong to THIS component, not the parent's
			// render — tracking them there would re-render the parent on every
			// child state change.
			untracked(() => {
				this.observe();

				if (this._component.onInit) {
					this._component.onInit();
				}
			});
		} finally {
			setActiveComponent(prevActive);
		}
	}

	public get component(): Component {
		return this._component;
	}

	/** True while this component's template is executing. */
	public get isRendering(): boolean {
		return this._rendering;
	}

	/** The component's selector (used by diagnostics and DevTools). */
	public get selector(): string {
		return this._meta.selector;
	}

	public registerDisposable(d: { destroy(): void }): void {
		this._disposables.add(d);
	}

	/**
	 * Queue a re-render of this component. Reactive fields and signals read in
	 * the template do this automatically; call it when something the template
	 * reads changed outside the reactive graph (the router does this when a
	 * route param changes under a component that stays mounted).
	 */
	public requestRender(): void {
		this.scheduleRender();
	}

	public getSelectCache(): Map<string, Signal<unknown>> {
		return this._selectCache;
	}

	/**
	 * Marks a cached select() entry as used by the current render pass so the
	 * post-render sweep keeps it. No-op for entries created outside a render
	 * (those are component-lifetime and never swept).
	 */
	public touchSelectEntry(fullKey: string): void {
		if (this._renderScopedSelects.has(fullKey)) {
			this._renderScopedSelects.set(fullKey, this._selectEpoch);
		}
	}

	/**
	 * Registers a select() entry created while this component was rendering as
	 * render-scoped: the component re-renders when its value changes, and the
	 * entry is destroyed by the first subsequent render that doesn't use it
	 * (an inline selector recreated under a new identity key, or a conditional
	 * branch no longer rendered). Entries created outside a render pass (class
	 * field initializers, onCreate) keep their component-lifetime semantics.
	 */
	public trackSelectEntry(fullKey: string, sig: Signal<unknown>): void {
		if (!this._rendering) {
			return;
		}
		this._renderScopedSelects.set(fullKey, this._selectEpoch);
		sig.subscribe(() => this.scheduleRender());
	}

	public connectedCallback(): void {
		// A reconnect cancels any pending teardown from a just-prior disconnect,
		// so moving the element in the DOM does not destroy its state.
		this._teardownScheduled = false;

		if (this._destroyed) {
			// Attached again after its teardown ran (a cached view, a
			// drag-and-drop library, a node a template toggles in and out).
			// Bring the framework side back to life: without this the element
			// rendered through a fresh render effect that no later disconnect
			// ever destroyed, and its field subscriptions stayed dead.
			this._destroyed = false;

			if (this._ownedResourcesDestroyed) {
				devWarn(
					`reconnect-after-destroy:${this._meta.selector}`,
					`<${this._meta.selector}> was attached again after it had been destroyed. Its template and handlers are restored, ` +
						'but the computeds, effects, forms and store selections it owned were destroyed with it and cannot be recreated — ' +
						'reading one now throws. Keep the element attached (moving it within the same task is fine), or create a new element instead of re-using this one.'
				);
			}
		}

		emitDevtools('component:connect', () => ({ id: this.devtoolsId(), selector: this._meta.selector }));

		this.subscribeReactiveSources();
		this.render();

		const prev = getActiveComponent();
		setActiveComponent(this);
		try {
			untracked(() => {
				// onCreate fires exactly once, the first time the element enters the DOM.
				if (!this._created) {
					this._created = true;
					this._component.onCreate?.();
				}
				// onConnect fires on every connect (including the first).
				this._component.onConnect?.();
			});
		} finally {
			setActiveComponent(prev);
		}
	}

	public disconnectedCallback(): void {
		emitDevtools('component:disconnect', () => ({ id: this.devtoolsId(), selector: this._meta.selector }));

		// Tear down reactive subscriptions immediately so a detached element stops
		// reacting; they are re-established on the next connect.
		for (const entry of this._reactiveSourceEntries) {
			for (const unsubscribe of entry.unsubscribers) {
				unsubscribe();
			}
			entry.unsubscribers = [];
		}

		try {
			untracked(() => this._component.onDisconnect?.());
		} finally {
			// Defer destruction of owned resources (forms/signals/directives) to a
			// microtask. A transient move (remove + re-add) reconnects first and
			// cancels this, so re-parenting preserves component state. Scheduled
			// even when the user hook throws, so a faulty hook cannot leak the
			// component's resources.
			if (!this._teardownScheduled && !this._destroyed) {
				this._teardownScheduled = true;
				queueMicrotask(() => {
					this._teardownScheduled = false;
					if (!this.isConnected && !this._destroyed) {
						this.teardown();
					}
				});
			}
		}
	}

	public attributeChangedCallback(attribute: string, oldVal: unknown, newVal: unknown): void {
		const prop = attributeToProperty(attribute);
		const component = this._component as unknown as Record<string, unknown>;

		const current = component[prop];
		const value = this.coerceAttributeValue(prop, newVal as string | null, current);

		// Skip the assignment and re-render when the reflected value is
		// identical — avoids render churn from equal attribute writes.
		if (!Object.is(current, value)) {
			component[prop] = value;
			this.scheduleRender();
		}

		if (this._component.onAttributeChange !== undefined) {
			untracked(() => this._component.onAttributeChange!(attribute, oldVal, newVal));
		}
	}

	/**
	 * Coerce an observed attribute's string value by the property's declared
	 * type. Type is determined by, in order: an explicit `static propertyTypes`
	 * declaration, the property's initial value type (captured in observe()),
	 * or the property's CURRENT value type. Properties with no type information
	 * (e.g. `open?: boolean` with no initializer) recognize the canonical
	 * boolean literals "true"/"false"; everything else passes through raw.
	 */
	private coerceAttributeValue(prop: string, raw: string | null, current: unknown): unknown {
		// Explicitly declared string properties are never coerced.
		if (this._stringProperties.has(prop)) {
			return raw;
		}

		// Boolean: present (any value except the literal "false") = true, absent = false.
		if (this._booleanProperties.has(prop) || typeof current === 'boolean') {
			return raw !== null && raw !== 'false';
		}

		// Number: coerce numeric strings; leave null (attribute removed) and
		// non-numeric garbage untouched rather than producing NaN.
		if (this._numberProperties.has(prop) || typeof current === 'number') {
			if (raw === null || raw.trim() === '') {
				return raw;
			}
			const parsed = Number(raw);
			return Number.isNaN(parsed) ? raw : parsed;
		}

		// No type information: recognize canonical boolean literals so an
		// initially-undefined `open?: boolean` never receives the truthy string "false".
		if ((current === undefined || current === null) && (raw === 'true' || raw === 'false')) {
			return raw === 'true';
		}

		return raw;
	}

	/** Final destruction — runs once when the element is permanently removed. */
	private teardown(): void {
		this._destroyed = true;

		if (this._devtoolsId !== 0) {
			emitDevtools('component:destroy', () => ({ id: this._devtoolsId, selector: this._meta.selector }));
			getHook()?.components.delete(this._devtoolsId);
		}

		if (this._renderBurstReset !== null) {
			clearTimeout(this._renderBurstReset);
			this._renderBurstReset = null;
		}
		this._renderCatchingUp = false;
		this._renderLoopReported = false;

		this._renderEffect?.destroy();
		this._renderEffect = null;

		// Recursively dispose the rendered part tree: action-directive cleanups
		// (e.g. clickOutside document listeners) plus everything nested inside
		// when/repeat branches, nested templates, and array items.
		const root = this._root as ShadowRoot & IRenderedContainer;
		const parts = root.__parts;
		if (parts) {
			disposeParts(parts);
		}

		// Drop the render bookkeeping with it. Leaving `__parts`/`__templateKey`
		// behind made a re-attached element a zombie: the renderer took the
		// unchanged-template fast path, skipped re-binding handlers whose
		// identity had not changed, and the element came back inert.
		delete root.__parts;
		delete (root as { __templateKey?: string }).__templateKey;

		// User's onDestroy runs first so user code can still reference signals
		// before they're destroyed. Framework cleanup runs in `finally`: a
		// throwing hook must not leave subscriptions and signals alive.
		try {
			// Once per component, even if the element is attached and removed
			// again afterwards: the hook's contract is "permanent removal".
			if (this._component.onDestroy !== undefined && !this._onDestroyRan) {
				this._onDestroyRan = true;
				untracked(() => this._component.onDestroy!());
			}
		} finally {
			if (this._disposables.size > 0) {
				this._ownedResourcesDestroyed = true;
			}
			for (const d of this._disposables) {
				try {
					d.destroy();
				} catch (error) {
					console.error('Disposable cleanup failed:', error);
				}
			}
			this._disposables.clear();
			this._selectCache.clear();
		}
	}

	/**
	 * Applies the component's styles to its shadow root.
	 *
	 * Preferred path: one shared CSSStyleSheet per component class, adopted via
	 * adoptedStyleSheets (no per-instance <style> element, one CSS parse per
	 * class). Fallback path (constructed stylesheets unsupported): the original
	 * per-instance <style> element, returned so render() can re-append it after
	 * the first template render wipes the root.
	 */
	private renderStyles(): HTMLStyleElement | null {
		if (!this._meta.styles) {
			return null;
		}

		const sheet = getComponentStyleSheet(this._meta.styles);
		if (sheet) {
			this._root.adoptedStyleSheets = [...this._root.adoptedStyleSheets, sheet];
			return null;
		}

		const styleNode: HTMLStyleElement = document.createElement('style');
		styleNode.textContent = getComponentStyleText(this._meta.styles);

		return this._root.appendChild(styleNode);
	}

	/**
	 * The element moved to another document (into an iframe, a new window).
	 *
	 * A constructed stylesheet belongs to the document that built it, and the
	 * platform empties `adoptedStyleSheets` when a shadow root changes
	 * document — so the component arrived unstyled and nothing put the styles
	 * back. Rebuild them for the new document, or fall back to a `<style>`
	 * element where that document cannot construct sheets.
	 */
	public adoptedCallback(): void {
		const componentStyles = this._meta.styles;
		const atHome = this.ownerDocument === document;

		let sheets: CSSStyleSheet[] | null = null;
		const texts: string[] = [...getGlobalStyleTexts()];
		if (componentStyles) {
			texts.push(getComponentStyleText(componentStyles));
		}

		if (texts.length === 0) {
			return;
		}

		if (atHome) {
			const componentSheet = componentStyles ? getComponentStyleSheet(componentStyles) : null;
			if (!componentStyles || componentSheet) {
				sheets = [...getGlobalStyleSheets()];
				if (componentSheet) {
					sheets.push(componentSheet);
				}
			}
		} else {
			sheets = getStyleSheetsForDocument(this.ownerDocument, texts);
		}

		if (sheets) {
			try {
				this._root.adoptedStyleSheets = sheets;
				// A `<style>` left behind by an earlier trip through a document
				// without constructed sheets would now apply everything twice.
				if (this._style && supportsConstructedStyleSheets()) {
					this._style.remove();
					this._style = null;
				}
				return;
			} catch {
				// Fall through to the element fallback.
			}
		}

		if (!this._style) {
			this._style = this.ownerDocument.createElement('style');
		}
		this._style.textContent = texts.join('\n');
		if (this._style.parentNode !== this._root) {
			this._root.appendChild(this._style);
		}
	}

	/**
	 * Render the template, tracking every signal read while it runs.
	 *
	 * The template body executes inside a `SignalEffect` whose invalidation
	 * schedules the next render, so a template reading `this.auth.user()` from
	 * an injected service — or a signal nested in an object or array — updates
	 * like any other reactive source. Before this, only component *fields*
	 * whose value happened to be a Signal were subscribed, and everything else
	 * silently never updated.
	 */
	private render(): void {
		if (this.enteredRenderLoop()) {
			return;
		}

		this._dirty = false;

		if (!this._renderEffect) {
			this._renderEffect = new SignalEffect(() => this.renderTemplate(), {
				name: this._meta.selector,
				// Never render synchronously from a signal write: batch through
				// the normal microtask so one flush produces one render.
				onInvalidate: () => this.scheduleRender()
			});
		}

		if (!devtoolsListening()) {
			this._renderEffect.runNow();
			return;
		}

		const started = performance.now();
		this._renderEffect.runNow();
		const elapsed = performance.now() - started;
		this._renderCount++;

		const record = getHook()?.components.get(this.devtoolsId());
		if (record) {
			record.renders = this._renderCount;
			record.lastRenderMs = elapsed;
		}

		emitDevtools('component:render', () => ({ id: this.devtoolsId(), selector: this._meta.selector, ms: elapsed, renders: this._renderCount }));
	}

	/** Stable DevTools id for this instance, registered on first use. */
	private devtoolsId(): number {
		if (this._devtoolsId === 0) {
			const hook = getHook();
			if (!hook) {
				return 0;
			}

			this._devtoolsId = hook.nextId();
			hook.components.set(this._devtoolsId, {
				id: this._devtoolsId,
				selector: this._meta.selector,
				host: new WeakRef(this),
				renders: this._renderCount,
				lastRenderMs: 0
			});
		}

		return this._devtoolsId;
	}

	private renderTemplate(): void {
		const prev = getActiveComponent();
		setActiveComponent(this);
		this._rendering = true;
		this._selectEpoch++;
		try {
			if (this._meta.template) {
				// Only build the attribute snapshot when the template actually
				// declares the parameter — nearly none do, and it allocated an
				// object plus an attribute walk on every render of every component.
				const templateResult = this._meta.template(this._component, this._meta.template.length > 1 ? this.getAttributeValues() : undefined);
				render(templateResult, this._root);

				if (this._style && this._style.parentNode !== this._root) {
					this._root.appendChild(this._style);
				}
			}

			if (this._component.onRender !== undefined) {
				// onRender is user code, not part of the template: reads made
				// here must not subscribe the render.
				untracked(() => this._component.onRender!());
			}
		} finally {
			this._rendering = false;
			setActiveComponent(prev);
			this.sweepRenderScopedSelects();
		}
	}

	/**
	 * Guard against a render loop — a property write in `onRender` that
	 * schedules another render, which writes again. Signals have a 100-run
	 * guard; components had none, so this reported nothing and simply spun.
	 */
	private enteredRenderLoop(): boolean {
		// A macrotask boundary means the burst was real work (user interaction,
		// network, timers), not a loop: the count starts again.
		const epoch = currentRenderTaskEpoch();
		if (epoch !== this._renderTaskEpoch) {
			this._renderTaskEpoch = epoch;
			this._rendersThisTask = 0;
		}

		if (++this._rendersThisTask <= MAX_RENDERS_PER_TASK) {
			return false;
		}

		if (!this._renderLoopReported) {
			this._renderLoopReported = true;
			console.error(
				`[Melodic] <${this._meta.selector}> rendered ${MAX_RENDERS_PER_TASK} times without yielding and was stopped. ` +
					'A render loop is usually a property or signal written from onRender (or from the template itself), ' +
					'which schedules the render that writes it again.'
			);
		}

		// The renders dropped from here on may have been legitimate — a burst
		// of awaited updates looks exactly like a loop — and nothing used to
		// render them later: the DOM stayed on a stale value until some
		// unrelated change. Grant ONE catch-up render after the task ends. A
		// real loop trips the guard again during it and is then left stopped.
		if (this._renderBurstReset === null && !this._renderCatchingUp) {
			this._renderBurstReset = setTimeout(() => {
				this._renderBurstReset = null;

				if (!this._dirty || !this.isConnected || this._destroyed) {
					this._renderLoopReported = false;
					return;
				}

				this._renderCatchingUp = true;
				this.scheduleRender();
				// Runs after the catch-up render's microtasks have settled.
				this._renderBurstReset = setTimeout(() => {
					this._renderBurstReset = null;
					this._renderCatchingUp = false;
					this._renderLoopReported = false;
				}, 0);
			}, 0);
		}

		return true;
	}

	/**
	 * Destroys render-scoped select() entries the just-finished render didn't
	 * touch. Without this, an inline selector (a new function identity every
	 * render) would accumulate one live computed per render for the life of
	 * the component, and every store dispatch would pay for all of them.
	 */
	private sweepRenderScopedSelects(): void {
		for (const [key, epoch] of this._renderScopedSelects) {
			if (epoch === this._selectEpoch) {
				continue;
			}
			const sig = this._selectCache.get(key) as unknown as { destroy(): void } | undefined;
			this._renderScopedSelects.delete(key);
			this._selectCache.delete(key);
			if (sig) {
				this._disposables.delete(sig);
				sig.destroy();
			}
		}
	}

	private scheduleRender(): void {
		this._dirty = true;

		if (this._renderScheduled) {
			return;
		}

		this._renderScheduled = true;
		queueMicrotask(() => {
			this._renderScheduled = false;
			// `_dirty` is cleared by any render that ran in the meantime —
			// notably the synchronous one in connectedCallback, which used to
			// be followed by a second, identical render from this microtask.
			if (this.isConnected && this._dirty) {
				this.render();
			}
		});
	}

	private observe(): void {
		const properties: string[] = [];
		const seen = new Set<string>();
		let proto: object | null = this._component;

		while (proto && proto !== Object.prototype) {
			for (const prop of Object.getOwnPropertyNames(proto)) {
				if (!seen.has(prop)) {
					seen.add(prop);
					properties.push(prop);
				}
			}
			proto = Object.getPrototypeOf(proto);
		}

		// Public getter-only accessors (computed properties): not reactive data,
		// but still part of the element's public surface. Mirrored onto the host
		// as lazy passthroughs after the reactive props are wired (see below).
		const getterOnly: string[] = [];

		// Properties holding a reactive source (Signal / AbstractControl). Wired
		// after the data props so reassignment swaps the render subscription.
		const sourceProps: string[] = [];

		// Fields holding a function (`formatter = (x) => x`). Not reactive data,
		// but a parent must still be able to pass one in with `.formatter=${fn}`.
		const functionFields: string[] = [];

		// Reactive data props, with the descriptor found while classifying them
		// (looked up once per property, not once per pass).
		const dataProps: Array<[prop: string, descriptor: PropertyDescriptor | undefined]> = [];

		for (const prop of properties) {
			// Skip private properties (convention) and framework-internal fields.
			if (prop.startsWith('_') || prop === 'elementRef' || prop === 'constructor') {
				continue;
			}

			const descriptor = this.getPropertyDescriptor(this._component, prop);

			// Skip lazy accessors — getter-only properties (computed getters) and
			// @Service injection points, which are writable so tests can assign a
			// fake but must still resolve lazily. Reading one here would resolve
			// the dependency during construction and reify it as reactive data.
			// Public ones are still surfaced on the host (without invoking the
			// getter here).
			const isServiceAccessor = `__service_${prop}` in this._component;
			if (descriptor && descriptor.get && (!descriptor.set || isServiceAccessor)) {
				getterOnly.push(prop);
				continue;
			}

			const value = (this._component as any)[prop];

			// Signals and form controls are reactive sources, not reactive data —
			// subscribe to them for re-renders, but don't wrap them as data.
			if (isSignal(value) || value instanceof AbstractControl) {
				sourceProps.push(prop);
				continue;
			}

			if (typeof value === 'function') {
				// A function FIELD (own property) is state a parent may replace;
				// a prototype method is behaviour and stays off the host.
				if (Object.prototype.hasOwnProperty.call(this._component, prop)) {
					functionFields.push(prop);
				}
				continue;
			}

			dataProps.push([prop, descriptor]);
		}

		for (const prop of sourceProps) {
			this.observeReactiveSource(prop);
		}

		for (const [prop, descriptor] of dataProps) {
			// Check if wrapper already has a value set (from property binding before observe ran)
			const wrapperValue = Object.getOwnPropertyDescriptor(this, prop)?.value;
			let value = wrapperValue === undefined ? (this._component as any)[prop] : wrapperValue;

			// Track boolean/number properties for attribute coercion (explicit
			// `static propertyTypes` declarations were seeded in the constructor).
			if (typeof value === 'boolean') {
				this._booleanProperties.add(prop);
			} else if (typeof value === 'number') {
				this._numberProperties.add(prop);
			}

			// Build getter/setter for the component's property
			let componentGetter = () => value;
			let componentSetter = (newVal: unknown) => {
				if (!Object.is(value, newVal)) {
					// untracked: a parent's render effect can be active while it writes
					// this property; the hook's reads belong to the component, not to it.
					untracked(() => this._component.onPropertyChange?.(prop, value, newVal));
					value = newVal;
					this.scheduleRender();
				}
			};

			// Preserve existing getters — return the real getter result (including
			// legitimate falsy values like 0, '', false, null).
			if (descriptor?.get) {
				const originalGetter = descriptor.get;
				componentGetter = () => originalGetter.call(this._component);
			}

			// Preserve existing setters
			if (descriptor?.set) {
				const originalSetter = descriptor.set;
				const baseSetter = componentSetter;
				componentSetter = (newVal) => {
					originalSetter.call(this._component, newVal);
					baseSetter(newVal);
				};
			}

			// Make the component's property reactive
			Object.defineProperty(this._component, prop, {
				get: componentGetter,
				set: componentSetter,
				enumerable: true,
				configurable: true
			});

			// Expose on wrapper for property binding (.prop=${value}) — unless the
			// name belongs to HTMLElement. Shadowing `hidden`, `title`, `id`,
			// `slot`, `dir` or `tabIndex` broke the platform behaviour they name:
			// `el.setAttribute('hidden', '')` left `el.hidden === false` and the
			// element stayed visible.
			if (isNativeElementProperty(prop)) {
				devWarn(
					`native-prop:${this._meta.selector}:${prop}`,
					`<${this._meta.selector}> declares a property "${prop}", which is also a native HTMLElement property. ` +
						`The native behaviour is kept on the element; the component's field is still reactive internally, ` +
						`but \`element.${prop}\` reads the platform value. Rename the field to avoid the collision.`
				);
			} else {
				Object.defineProperty(this, prop, {
					get: componentGetter,
					set: componentSetter,
					enumerable: true,
					configurable: true
				});
			}
		}

		// Mirror public computed getters onto the host so `el.prop` reads the live
		// value. The passthrough delegates to the component lazily — it never
		// invokes the getter during observe(), so @Service-style lazy getters keep
		// their deferred resolution. A no-op setter keeps accidental writes from
		// throwing (a computed property has nothing to assign to).
		for (const prop of getterOnly) {
			if (Object.prototype.hasOwnProperty.call(this, prop)) {
				continue;
			}

			Object.defineProperty(this, prop, {
				get: () => (this._component as any)[prop],
				set: () => {},
				enumerable: true,
				configurable: true
			});
		}

		// Fields a parent could not reach before. `.formatter=${fn}`,
		// `.value=${x}` on a signal field and `.open=${true}` on an observed
		// attribute with no initializer all landed as a plain property on the
		// element — no error, no warning, and the component never saw the value.
		for (const prop of functionFields) {
			this.exposePassthrough(prop);
		}
		for (const prop of sourceProps) {
			this.exposePassthrough(prop);
		}
		for (const attribute of attributeNames(this._meta.attributes)) {
			const prop = attributeToProperty(attribute);
			// An attribute pointed at a method is a declaration mistake (warned
			// about at registration); do not make the method assignable too.
			if (!seen.has(prop) || typeof (this._component as any)[prop] !== 'function' || Object.prototype.hasOwnProperty.call(this._component, prop)) {
				this.exposePassthrough(prop);
			}
		}

		this.warnAboutUnknownHostProperties();
	}

	/**
	 * Expose `prop` on the element as a passthrough to the component field.
	 *
	 * The accessor carries no per-instance state, so it is defined once on the
	 * generated element class rather than on every instance. A value assigned
	 * before the element was upgraded (a parent template commits its bindings
	 * before the child is connected) sits on the instance as a plain property,
	 * where it would shadow the accessor: it is taken off and forwarded.
	 */
	private exposePassthrough(prop: string): void {
		// Never shadow the platform's members or the framework's own.
		if (prop in ComponentBase.prototype) {
			return;
		}

		let pending: unknown;
		const own = Object.getOwnPropertyDescriptor(this, prop);
		if (own) {
			if (own.get || own.set || !own.configurable) {
				// Already exposed (a reactive data prop or a getter passthrough).
				return;
			}
			pending = own.value;
			delete (this as unknown as Record<string, unknown>)[prop];
		}

		const elementClass = Object.getPrototypeOf(this) as object;
		if (!Object.prototype.hasOwnProperty.call(elementClass, prop)) {
			Object.defineProperty(elementClass, prop, {
				get(this: ComponentBase): unknown {
					return (this._component as unknown as Record<string, unknown>)[prop];
				},
				set(this: ComponentBase, value: unknown): void {
					this.writeFromHost(prop, value);
				},
				enumerable: true,
				configurable: true
			});
		}

		// `undefined` means "nothing was bound", matching the data-prop path.
		if (pending !== undefined) {
			this.writeFromHost(prop, pending);
		}
	}

	/** A write to a passthrough property on the element (see exposePassthrough). */
	private writeFromHost(prop: string, value: unknown): void {
		const component = this._component as unknown as Record<string, unknown>;
		const current = component[prop];

		if (Object.is(current, value)) {
			return;
		}

		// A plain value bound to a field that holds a signal is a write TO the
		// signal — replacing the signal with the value would break every
		// `this.field()` read in the component.
		if (isSignal(current) && !isSignal(value)) {
			try {
				(current as Signal<unknown>).set(value);
			} catch (error) {
				devWarn(
					`host-write-readonly:${this._meta.selector}:${prop}`,
					`<${this._meta.selector}>.${prop} holds a read-only signal, so the value bound to it was ignored.`,
					error
				);
			}
			return;
		}

		if (current instanceof AbstractControl && !(value instanceof AbstractControl)) {
			devWarn(
				`host-write-control:${this._meta.selector}:${prop}`,
				`<${this._meta.selector}>.${prop} holds a form control; bind a control to it (or bind the value to the control), not a plain value. The write was ignored.`
			);
			return;
		}

		component[prop] = value;
		this.scheduleRender();
	}

	/**
	 * Dev-only: report properties that were assigned to the element before it
	 * was upgraded but that the component does not declare. This is what a
	 * `.label=${x}` binding to a field with no initializer leaves behind — the
	 * field does not exist until something assigns it, so the framework cannot
	 * see it, and the binding silently does nothing.
	 */
	private warnAboutUnknownHostProperties(): void {
		if (!isDevMode()) {
			return;
		}

		for (const prop of Object.keys(this)) {
			if (prop.startsWith('_')) {
				continue;
			}

			const descriptor = Object.getOwnPropertyDescriptor(this, prop);
			if (!descriptor || descriptor.get || descriptor.set) {
				continue;
			}

			devWarn(
				`unknown-prop:${this._meta.selector}:${prop}`,
				`A value was bound to <${this._meta.selector}>.${prop}, but the component declares no "${prop}" property, so it was ignored. ` +
					`Give the field an initializer (\`${prop} = undefined\` is enough) or list it in the component's \`attributes\`.`
			);
		}
	}

	private getPropertyDescriptor(target: object, prop: string): PropertyDescriptor | undefined {
		let current: object | null = target;

		while (current && current !== Object.prototype) {
			const descriptor = Object.getOwnPropertyDescriptor(current, prop);
			if (descriptor) {
				return descriptor;
			}
			current = Object.getPrototypeOf(current);
		}

		return undefined;
	}

	private getAttributeValues(): Record<string, string> {
		const attributes: Record<string, string> = {};
		this.getAttributeNames().forEach((attrName: string) => {
			attributes[attrName] = this.getAttribute(attrName) ?? '';
		});

		return attributes;
	}

	private subscribeReactiveSources(): void {
		if (this._destroyed) {
			return;
		}

		for (const entry of this._reactiveSourceEntries) {
			// Defensive: never double-subscribe an entry.
			for (const unsubscribe of entry.unsubscribers) {
				unsubscribe();
			}
			entry.unsubscribers = this.subscribeSources(entry.signals);
		}
	}

	/** Subscribe the render to each source, skipping any that has been destroyed. */
	private subscribeSources(signals: Array<Signal<unknown>>): Array<Unsubscriber> {
		const unsubscribers: Array<Unsubscriber> = [];

		for (const source of signals) {
			try {
				unsubscribers.push(source.subscribe(() => this.scheduleRender()));
			} catch {
				// A destroyed signal refuses new subscribers. That is expected
				// for a computed this component owned once the element has been
				// torn down and attached again (see connectedCallback) — it can
				// never change again, so there is nothing to subscribe to.
			}
		}

		return unsubscribers;
	}

	/** The signals a reactive-source value contributes re-render subscriptions for. */
	private collectSourceSignals(value: unknown): Array<Signal<unknown>> {
		if (isSignal(value)) {
			return [value as Signal<unknown>];
		}

		if (value instanceof AbstractControl) {
			// Re-render when either the control's value OR its status (state)
			// changes, so templates reading control.value() stay in sync even
			// when the value change doesn't alter dirty/touched/validity.
			return [value.value as Signal<unknown>, value.state as Signal<unknown>];
		}

		return [];
	}

	/**
	 * Wire a component field holding a Signal/AbstractControl so its render
	 * subscription follows reassignment: `this.form = createFormGroup(...)`
	 * after construction unsubscribes the old source and subscribes the new one
	 * instead of silently going inert.
	 */
	private observeReactiveSource(prop: string): void {
		const component = this._component as unknown as Record<string, unknown>;
		const entry: ReactiveSourceEntry = {
			signals: this.collectSourceSignals(component[prop]),
			unsubscribers: []
		};
		this._reactiveSourceEntries.push(entry);

		const descriptor = this.getPropertyDescriptor(this._component, prop);
		if (descriptor && (descriptor.get || descriptor.set)) {
			// Custom accessor — leave it intact and subscribe to the
			// construction-time snapshot only (pre-existing behavior).
			return;
		}

		let current = component[prop];

		Object.defineProperty(this._component, prop, {
			get: () => current,
			set: (newVal: unknown) => {
				if (Object.is(current, newVal)) {
					return;
				}

				untracked(() => this._component.onPropertyChange?.(prop, current, newVal));
				current = newVal;

				// Swap the render subscription to the new source.
				for (const unsubscribe of entry.unsubscribers) {
					unsubscribe();
				}
				entry.unsubscribers = [];
				entry.signals = this.collectSourceSignals(newVal);

				if (this.isConnected && !this._destroyed) {
					entry.unsubscribers = this.subscribeSources(entry.signals);
				}

				this.scheduleRender();
			},
			enumerable: true,
			configurable: true
		});
	}
}
