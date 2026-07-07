export type TemplatePartType = 'node' | 'attribute' | 'boolean-attribute' | 'property' | 'event' | 'action';

/** A keyed item rendered by plain-array interpolation (values produced by key helpers). */
export interface IKeyedArrayItem {
	key: unknown;
	value: unknown;
	container: DocumentFragment;
	nodes: Node[];
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
	// Persistent container for nested TemplateResults — enables in-place updates
	// instead of destroying and recreating DOM on every parent re-render
	nestedContainer?: DocumentFragment;
	/**
	 * Containers for non-keyed array items rendered from TemplateResults.
	 * Retained so their part trees can be disposed when the array re-renders
	 * or is discarded.
	 */
	renderedContainers?: DocumentFragment[];
}
