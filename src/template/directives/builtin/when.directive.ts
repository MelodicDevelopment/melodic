/**
 * When directive - Conditional rendering
 *
 * Efficiently shows/hides content based on a condition.
 * Removes from DOM when false, adds back when true.
 */

import type { TemplateResult } from '../../classes/template-result.class';
import type { RenderedContainer } from '../../interfaces/irendered-container.interface';
import { disposeContainerParts } from '../../functions/dispose.functions';
import { clearBetween, restoreDirectiveContainer } from '../../functions/marker-range.functions';
import { directive } from '../functions/directive.function';
import { type IDirectiveResult } from '../interfaces/idirective-result.interface';

interface WhenState {
	condition: boolean;
	container: DocumentFragment | null;
	startMarker: Comment;
	endMarker: Comment;
	/** Disposal contract (see IDirectiveState) — releases the rendered branch's part tree. */
	__dispose: () => void;
}

/**
 * Conditionally renders a template.
 *
 * Usage:
 *   when(isLoggedIn, () => html`<div>Welcome!</div>`)
 *   when(isLoggedIn, () => html`<div>Welcome!</div>`, () => html`<div>Please log in</div>`)
 *
 * @param condition - When true, renders the template. When false, removes from DOM (or renders falseTemplate if provided).
 * @param template - Template function to render when condition is true
 * @param falseTemplate - Optional template function to render when condition is false
 */
export function when(
	condition: boolean,
	template: () => TemplateResult,
	falseTemplate?: () => TemplateResult
): IDirectiveResult {
	return directive((container: Node, previousState?: WhenState): WhenState => {
		// First render - setup markers
		if (!previousState) {
			const parent = container.parentNode;
			if (!parent) {
				throw new Error('when() directive: container must be attached to a parent node');
			}

			const startMarker = document.createComment('when-start');
			const endMarker = document.createComment('when-end');

			parent.replaceChild(startMarker, container);
			parent.insertBefore(endMarker, startMarker.nextSibling);

			const state: WhenState = {
				condition: false,
				container: null,
				startMarker,
				endMarker,
				__dispose: () => {
					if (state.container) {
						disposeContainerParts(state.container);
						state.container = null;
					}
				}
			};

			try {
				if (condition) {
					renderContent(state, template());
				} else if (falseTemplate) {
					renderContent(state, falseTemplate());
				}
			} catch (error) {
				// The branch threw before any state could be handed back to
				// the engine — undo the marker setup so the next render can
				// try again instead of failing forever.
				state.__dispose();
				restoreDirectiveContainer(container, startMarker, endMarker);
				throw error;
			}

			state.condition = condition;
			return state;
		}

		// Get parent from the markers (which are still in the DOM)
		const parent = previousState.startMarker.parentNode;
		if (!parent) {
			throw new Error('when() directive: markers were removed from DOM');
		}

		// Condition changed from false to true
		if (condition && !previousState.condition) {
			removeContent(previousState);
			// Record the flip before running the branch: if it throws, the
			// old branch is already gone and the next render must not treat
			// the (empty) range as "still showing the other branch".
			previousState.condition = condition;
			renderContent(previousState, template());
		}
		// Condition changed from true to false
		else if (!condition && previousState.condition) {
			removeContent(previousState);
			previousState.condition = condition;
			if (falseTemplate) {
				renderContent(previousState, falseTemplate());
			}
		}
		// Condition still true - update template
		else if (condition && previousState.condition) {
			updateContent(previousState, template());
		}
		// Condition still false - update the false template, or remove a
		// previously rendered fallback that is no longer provided
		else if (!condition && !previousState.condition) {
			if (falseTemplate) {
				updateContent(previousState, falseTemplate());
			} else if (previousState.container) {
				removeContent(previousState);
			}
		}

		previousState.condition = condition;
		return previousState;
	}, 'when');
}

function renderContent(state: WhenState, templateToRender: TemplateResult): void {
	const parent = state.startMarker.parentNode;
	if (!parent) {
		throw new Error('when() directive: markers not in DOM');
	}

	const container = document.createDocumentFragment();
	templateToRender.renderInto(container);
	state.container = container;

	// Insert the rendered nodes between the markers. The container keeps the
	// part tree (__parts/__templateKey) for in-place updates.
	parent.insertBefore(container, state.endMarker);
}

/**
 * Updates the currently rendered branch with a new template.
 *
 * Same template STRUCTURE (same tagged template literal) updates the existing
 * DOM in place. A different structure (e.g. the branch function itself returns
 * different templates conditionally) cannot be diffed against the detached
 * container — the old content is disposed and the new template is rendered
 * fresh between the markers.
 */
function updateContent(state: WhenState, newTemplate: TemplateResult): void {
	const container = state.container as RenderedContainer<DocumentFragment> | null;

	if (container && container.__templateKey === newTemplate.templateKey) {
		newTemplate.renderInto(container);
	} else {
		removeContent(state);
		renderContent(state, newTemplate);
	}
}

function removeContent(state: WhenState): void {
	// Recursively dispose the removed branch's part tree so directive/action
	// cleanups (e.g. :formControl subscriptions) run before the nodes go away.
	if (state.container) {
		disposeContainerParts(state.container);
	}

	// Remove the LIVE range between the markers rather than a snapshot of the
	// nodes inserted at render time: a nested part inside the branch may have
	// swapped its own nodes since, and those must not outlive the branch.
	clearBetween(state.startMarker, state.endMarker);
	state.container = null;
}
