/**
 * When directive - Conditional rendering
 *
 * Efficiently shows/hides content based on a condition.
 * Removes from DOM when false, adds back when true.
 */

import type { TemplateResult } from '../../template-result.class';
import { directive } from '../functions/directive.function';
import { type IDirectiveResult } from '../interfaces/idirective-result.interface';

interface WhenState {
	condition: boolean;
	template: TemplateResult;
	container: DocumentFragment | null;
	startMarker: Comment;
	endMarker: Comment;
	nodes: Node[];
}

/**
 * Conditionally renders a template.
 *
 * Usage:
 *   when(isLoggedIn, () => html`<div>Welcome!</div>`)
 *
 * @param condition - When true, renders the template. When false, removes from DOM.
 * @param template - Template function to render when condition is true
 */
export function when(condition: boolean, template: () => TemplateResult): IDirectiveResult {
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
				template: template(),
				container: null,
				startMarker,
				endMarker,
				nodes: []
			};

			if (condition) {
				renderContent(state);
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
			previousState.template = template();
			renderContent(previousState);
		}
		// Condition changed from true to false
		else if (!condition && previousState.condition) {
			removeContent(previousState);
		}
		// Condition still true - update template
		else if (condition && previousState.condition) {
			const newTemplate = template();
			if (previousState.container) {
				newTemplate.renderInto(previousState.container);
			}
			previousState.template = newTemplate;
		}

		previousState.condition = condition;
		return previousState;
	});
}

function renderContent(state: WhenState): void {
	const parent = state.startMarker.parentNode;
	if (!parent) {
		throw new Error('when() directive: markers not in DOM');
	}

	const container = document.createDocumentFragment();
	state.template.renderInto(container);
	state.container = container;

	// Insert nodes between markers
	state.nodes = Array.from(container.childNodes);
	for (const node of state.nodes) {
		parent.insertBefore(node, state.endMarker);
	}
}

function removeContent(state: WhenState): void {
	for (const node of state.nodes) {
		node.parentNode?.removeChild(node);
	}
	state.nodes = [];
	state.container = null;
}
