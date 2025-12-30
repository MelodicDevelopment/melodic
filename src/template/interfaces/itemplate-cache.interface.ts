import type { ITemplatePart } from './itemplate-part.interface';

/**
 * Represents a path to a node in the template DOM tree.
 * Each number is a childNodes index to follow from the root.
 */
export interface IPartPath {
	/** Path of childNodes indices to reach the target node */
	path: number[];
	/** Type of part at this location */
	type: 'node' | 'attribute' | 'event' | 'property' | 'action';
	/** Part index in the values array */
	index: number;
	/** For attributes/events/properties/actions: the name */
	name?: string;
	/** For static action directives: the value */
	staticValue?: string;
	/** For composite attributes: the string segments */
	attributeStrings?: string[];
	/** For composite attributes: the value indices */
	attributeIndices?: number[];
}

export interface ITemplateCache {
	element: HTMLTemplateElement;
	parts: ITemplatePart[];
	// Pre-computed paths for direct node access (skips DOM walking)
	partPaths: IPartPath[];
}
