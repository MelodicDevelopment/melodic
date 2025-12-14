export interface ITemplatePart {
	type: 'node' | 'attribute' | 'property' | 'event' | 'action';
	index: number;
	name?: string;
	node?: Node;
	previousValue?: unknown;
	directiveState?: any; // State for directives (like repeat())
	// For node parts that render nested templates/nodes, track the rendered nodes
	renderedNodes?: Node[];
	startMarker?: Comment;
	endMarker?: Comment;
	// For action directives, store cleanup function and static value
	actionCleanup?: () => void;
	staticValue?: string; // For static :directive="value" attributes
}
