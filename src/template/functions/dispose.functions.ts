import type { ITemplatePart } from '../interfaces/itemplate-part.interface';
import type { IDirectiveState } from '../interfaces/idirective-state.interface';
import type { RenderedContainer } from '../interfaces/irendered-container.interface';

/**
 * Recursive disposal of the rendered part tree.
 *
 * Disposal runs cleanup callbacks (action-directive cleanups, directive state
 * disposers) and recursively walks every nested rendered container so that
 * cleanups registered anywhere in the tree run when content is discarded.
 * Disposal never removes DOM nodes — callers remove nodes (or discard the
 * whole subtree) themselves.
 *
 * All disposal functions are idempotent: disposed references are cleared so a
 * second pass over the same part is a no-op.
 */

/**
 * Dispose the directive state object returned by a directive's render
 * function, if it implements the `__dispose` contract.
 */
export function disposeDirectiveState(state: unknown): void {
	if (state !== null && typeof state === 'object' && typeof (state as IDirectiveState).__dispose === 'function') {
		try {
			(state as Required<Pick<IDirectiveState, '__dispose'>>).__dispose();
		} catch (error) {
			console.error('Directive state disposal failed:', error);
		}
	}
}

/**
 * Dispose a single template part: runs its action cleanup, disposes its
 * directive state, and recursively disposes any nested rendered containers
 * (nested templates, keyed/plain array items).
 */
export function disposePart(part: ITemplatePart): void {
	if (part.actionCleanup) {
		try {
			part.actionCleanup();
		} catch (error) {
			console.error('Action directive cleanup failed:', error);
		} finally {
			part.actionCleanup = undefined;
		}
	}

	if (part.nestedContainer) {
		disposeContainerParts(part.nestedContainer);
		part.nestedContainer = undefined;
	}

	if (part.renderedContainers) {
		for (const container of part.renderedContainers) {
			disposeContainerParts(container);
		}
		part.renderedContainers = undefined;
	}

	if (part.arrayState) {
		for (const item of part.arrayState.items.values()) {
			disposeContainerParts(item.container);
		}
		part.arrayState = undefined;
	}

	if (part.directiveState !== undefined) {
		disposeDirectiveState(part.directiveState);
		part.directiveState = undefined;
		part.directiveType = undefined;
	}
}

/** Dispose a list of template parts (see disposePart). */
export function disposeParts(parts: ITemplatePart[]): void {
	for (const part of parts) {
		disposePart(part);
	}
}

/**
 * Dispose the part tree stored on a rendered container (a container a
 * TemplateResult was rendered into). No-op when the container has no parts.
 */
export function disposeContainerParts(container: Node): void {
	const parts = (container as RenderedContainer).__parts;
	if (parts) {
		disposeParts(parts);
	}
}
