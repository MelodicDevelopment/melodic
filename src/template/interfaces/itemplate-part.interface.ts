export type TemplatePartType = 'node' | 'attribute' | 'boolean-attribute' | 'property' | 'event' | 'action';

/** A keyed item rendered by plain-array interpolation (values produced by key helpers). */
export interface IKeyedArrayItem {
	key: unknown;
	value: unknown;
	container: DocumentFragment;
	nodes: Node[];
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
