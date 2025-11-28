/**
 * When directive - Conditional rendering
 *
 * Efficiently shows/hides content based on a condition.
 * Removes from DOM when false, adds back when true.
 */

import type { DirectiveResult } from '../directive';
import type { TemplateResult } from '../template';

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
export function when(
	condition: boolean,
	template: () => TemplateResult
): DirectiveResult {
	return {
		__directive: true,
		render(container: Node, previousState?: WhenState): WhenState {
			const parent = container.parentElement || container;

			// First render - setup markers
			if (!previousState) {
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
					renderContent(state, parent);
				}

				state.condition = condition;
				return state;
			}

			// Condition changed from false to true
			if (condition && !previousState.condition) {
				previousState.template = template();
				renderContent(previousState, parent);
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
		}
	};
}

function renderContent(state: WhenState, parent: Node): void {
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
