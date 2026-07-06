import type { ITemplatePart } from './itemplate-part.interface';

/**
 * A DOM container (element, shadow root, or document fragment) that has had a
 * TemplateResult rendered into it. The template engine stores the live part
 * tree and the template's structural key on the container so subsequent
 * renders can update in place, and so teardown can dispose the tree.
 */
export interface IRenderedContainer {
	/** Live parts for the template rendered into this container. */
	__parts?: ITemplatePart[];
	/** Structural key of the tagged template currently rendered here. */
	__templateKey?: string;
}

/** Convenience intersection for casting DOM nodes that carry rendered-part state. */
export type RenderedContainer<T extends Node = Node> = T & IRenderedContainer;
