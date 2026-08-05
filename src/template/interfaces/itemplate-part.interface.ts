export type TemplatePartType = 'node' | 'attribute' | 'boolean-attribute' | 'property' | 'event' | 'action';

/**
 * One item of an array rendered into a node part.
 *
 * `container` is a persistent DocumentFragment the item's TemplateResult was
 * rendered into; it retains the item's part tree (`__parts`/`__templateKey`)
 * after `nodes` move into the live DOM, which is what allows the item to be
 * updated in place on a later render instead of being rebuilt.
 */
export interface IArrayItem {
	value: unknown;
	container: DocumentFragment;
	nodes: Node[];
}

/** A keyed item rendered by plain-array interpolation (values produced by key helpers). */
export interface IKeyedArrayItem extends IArrayItem {
	key: unknown;
}

/**
 * Event binding value form supporting listener options:
 * `@scroll=${{ handleEvent: (e) => …, passive: true, once: false, capture: false }}`
 * The object is registered through a stable wrapper listener; changing any of
 * the option flags re-attaches the underlying listener with the new options.
 */
export interface IEventHandlerWithOptions extends EventListenerObject {
	capture?: boolean;
	once?: boolean;
	passive?: boolean;
}

export interface ITemplatePart {
	type: TemplatePartType;
	index: number;
	name?: string;
	node?: Node;
	previousValue?: unknown;
	/**
	 * State returned by a directive's render function (see IDirectiveState for
	 * the optional disposal contract). Owned by the directive identified by
	 * `directiveType`.
	 */
	directiveState?: unknown;
	/**
	 * Identity of the directive factory that produced `directiveState` (the
	 * `type` tag on IDirectiveResult). Used to detect a binding switching
	 * between two different directive types so stale state is never passed
	 * across directives.
	 */
	directiveType?: string | symbol;
	// For node parts that render nested templates/nodes, track the rendered nodes
	renderedNodes?: Node[];
	startMarker?: Comment;
	endMarker?: Comment;
	// For action directives, store cleanup function and static value
	actionCleanup?: () => void;
	/**
	 * Stable wrapper listener for event parts. Attached ONCE (per options set)
	 * via addEventListener and kept across renders — handler changes swap
	 * `eventHandler` instead of re-registering the listener.
	 */
	eventWrapper?: EventListener;
	/**
	 * The current handler the stable wrapper delegates to: a plain function or
	 * an object implementing `handleEvent` (optionally carrying listener
	 * options — see IEventHandlerWithOptions).
	 */
	eventHandler?: unknown;
	/** Listener options the stable wrapper is currently registered with. */
	eventOptions?: AddEventListenerOptions;
	/** Whether the stable wrapper is currently registered on the node. */
	eventAttached?: boolean;
	staticValue?: string; // For static :directive="value" attributes
	attributeStrings?: string[];
	attributeIndices?: number[];
	arrayState?: {
		items: Map<unknown, IKeyedArrayItem>;
		keys: unknown[];
	};
	/**
	 * State for a plain (unkeyed) interpolated array — the `${items.map(…)}`
	 * form. Items are addressed by index so consecutive renders update the
	 * existing nodes in place instead of tearing the list down and rebuilding
	 * it, which preserves DOM identity (focus, selection, scroll, transitions,
	 * and in-flight mousedown→mouseup click sequences).
	 *
	 * Index-addressed reuse does NOT track items across reordering — that is
	 * what the `repeat()` directive is for.
	 */
	positionalArrayState?: {
		items: IArrayItem[];
		/** Dev-only latch so the unkeyed-churn advisory is emitted once per part. */
		warnedChurn?: boolean;
	};
	// Persistent container for nested TemplateResults — enables in-place updates
	// instead of destroying and recreating DOM on every parent re-render
	nestedContainer?: DocumentFragment;
	/**
	 * Containers whose part trees must be disposed when the part's content is
	 * discarded. Unkeyed arrays now own per-item containers through
	 * `positionalArrayState`; this remains as the disposal hook for any content
	 * rendered into a flat list of containers.
	 */
	renderedContainers?: DocumentFragment[];
}
