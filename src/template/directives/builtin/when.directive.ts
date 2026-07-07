/**
 * When directive - Conditional rendering
 *
 * Efficiently shows/hides content based on a condition.
 * Removes from DOM when false, adds back when true.
 */

import type { TemplateResult } from '../../classes/template-result.class';
import type { RenderedContainer } from '../../interfaces/irendered-container.interface';
import { disposeContainerParts } from '../../functions/dispose.functions';
import { directive } from '../functions/directive.function';
import { type IDirectiveResult } from '../interfaces/idirective-result.interface';

interface WhenState {
	condition: boolean;
	template: TemplateResult | null;
	falseTemplate: TemplateResult | null;
	container: DocumentFragment | null;
	startMarker: Comment;
	endMarker: Comment;
	nodes: Node[];
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
				template: null,
				falseTemplate: null,
				container: null,
				startMarker,
				endMarker,
				nodes: [],
				__dispose: () => {
					if (state.container) {
						disposeContainerParts(state.container);
						state.container = null;
					}
				}
			};

			if (condition) {
				state.template = template();
				renderContent(state, true);
			} else if (falseTemplate) {
				state.falseTemplate = falseTemplate();
				renderContent(state, false);
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
			previousState.template = template();
			renderContent(previousState, true);
		}
		// Condition changed from true to false
		else if (!condition && previousState.condition) {
			removeContent(previousState);
			if (falseTemplate) {
				previousState.falseTemplate = falseTemplate();
				renderContent(previousState, false);
			}
		}
		// Condition still true - update template
		else if (condition && previousState.condition) {
			updateContent(previousState, template(), true);
		}
		// Condition still false - update false template if provided
		else if (!condition && !previousState.condition && falseTemplate) {
			updateContent(previousState, falseTemplate(), false);
		}

		previousState.condition = condition;
		return previousState;
	}, 'when');
}

function renderContent(state: WhenState, useTrueTemplate: boolean): void {
	const parent = state.startMarker.parentNode;
	if (!parent) {
		throw new Error('when() directive: markers not in DOM');
	}

	const templateToRender = useTrueTemplate ? state.template : state.falseTemplate;
	if (!templateToRender) return;

	const container = document.createDocumentFragment();
	templateToRender.renderInto(container);
	state.container = container;

	// Insert nodes between markers
	state.nodes = Array.from(container.childNodes);
	for (const node of state.nodes) {
		parent.insertBefore(node, state.endMarker);
	}
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
function updateContent(state: WhenState, newTemplate: TemplateResult, useTrueTemplate: boolean): void {
	const container = state.container as RenderedContainer<DocumentFragment> | null;

	if (container && container.__templateKey === newTemplate.templateKey) {
		newTemplate.renderInto(container);
	} else {
		removeContent(state);
		if (useTrueTemplate) {
			state.template = newTemplate;
		} else {
			state.falseTemplate = newTemplate;
		}
		renderContent(state, useTrueTemplate);
	}

	if (useTrueTemplate) {
		state.template = newTemplate;
	} else {
		state.falseTemplate = newTemplate;
	}
}

function removeContent(state: WhenState): void {
	// Recursively dispose the removed branch's part tree so directive/action
	// cleanups (e.g. :formControl subscriptions) run before the nodes go away.
	if (state.container) {
		disposeContainerParts(state.container);
	}

	for (const node of state.nodes) {
		node.parentNode?.removeChild(node);
	}
	state.nodes = [];
	state.container = null;
}
