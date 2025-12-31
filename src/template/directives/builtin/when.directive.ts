/**
 * When directive - Conditional rendering
 *
 * Efficiently shows/hides content based on a condition.
 * Removes from DOM when false, adds back when true.
 */

import type { TemplateResult } from '../../classes/template-result.class';
import { directive } from '../functions/directive.function';
import { type IDirectiveResult } from '../interfaces/idirective-result.interface';

interface WhenState {
	condition: boolean;
	template: TemplateResult;
	falseTemplate: TemplateResult | null;
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
				template: template(),
				falseTemplate: falseTemplate ? falseTemplate() : null,
				container: null,
				startMarker,
				endMarker,
				nodes: []
			};

			if (condition) {
				renderContent(state, true);
			} else if (state.falseTemplate) {
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
			const newTemplate = template();
			if (previousState.container) {
				newTemplate.renderInto(previousState.container);
			}
			previousState.template = newTemplate;
		}
		// Condition still false - update false template if provided
		else if (!condition && !previousState.condition && falseTemplate) {
			const newFalseTemplate = falseTemplate();
			if (previousState.container) {
				newFalseTemplate.renderInto(previousState.container);
			}
			previousState.falseTemplate = newFalseTemplate;
		}

		previousState.condition = condition;
		return previousState;
	});
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

function removeContent(state: WhenState): void {
	for (const node of state.nodes) {
		node.parentNode?.removeChild(node);
	}
	state.nodes = [];
	state.container = null;
}
