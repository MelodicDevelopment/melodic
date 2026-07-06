import { registerAttributeDirective } from '@melodicdev/core/template';
import type { AttributeDirectiveCleanupFunction } from '@melodicdev/core/template';
// Registers the <ml-tooltip> custom element the directive instantiates.
import '../components/overlays/tooltip/index.js';
import type { TooltipComponent } from '../components/overlays/tooltip/tooltip.component.js';

/**
 * Tooltip attribute directive - attaches an ml-tooltip to an element
 *
 * Usage:
 * ```html
 * <!-- Static content -->
 * <div :tooltip="Helpful tip">Hover me</div>
 *
 * <!-- Dynamic content (updates propagate on re-render) -->
 * <ml-button :tooltip=${this.helpText}>Help</ml-button>
 *
 * <!-- With placement (defaults to "top") -->
 * <span :tooltip=${{ content: 'Info', placement: 'bottom' }}>Info</span>
 * ```
 *
 * The element is never reparented: a slotless ml-tooltip is managed as a
 * sibling overlay whose popup is anchored to the element (via the tooltip's
 * `anchorEl` override), and shows/hides on the same triggers ml-tooltip uses
 * (hover, focusin/focusout, Escape-to-dismiss).
 */

export interface TooltipDirectiveOptions {
	content: string;
	placement?: string;
}

type TooltipHostElement = HTMLElement & { component?: TooltipComponent; anchorEl?: HTMLElement | null };

interface TooltipDirectiveState {
	tooltip: TooltipHostElement;
	/** Set by cleanup; a same-tick directive re-run clears it to adopt the tooltip. */
	pendingRemoval: boolean;
	/** True when the directive set aria-describedby (and so should remove it). */
	ownsDescribedBy: boolean;
	show: EventListener;
	hide: EventListener;
}

/**
 * Live tooltip state per decorated element. The template engine always runs
 * the previous cleanup before re-running a directive with a new value; the
 * map lets that re-run adopt the existing ml-tooltip (updating its content
 * in place) instead of destroying and recreating it.
 */
const tooltipStates = new WeakMap<Element, TooltipDirectiveState>();

function parseValue(value: unknown): TooltipDirectiveOptions {
	if (typeof value === 'string') {
		return { content: value };
	}

	if (value && typeof value === 'object' && 'content' in value) {
		return value as TooltipDirectiveOptions;
	}

	return { content: String(value ?? '') };
}

/**
 * Insert the tooltip as the element's next sibling so its popup inherits the
 * element's theme context. Safe when the element has no parent yet — in that
 * case insertion is retried on the first show trigger (by which point the
 * element is in the DOM and can receive events).
 */
function ensureInserted(element: Element, tooltip: HTMLElement): void {
	if (tooltip.isConnected || !element.parentNode) return;
	element.parentNode.insertBefore(tooltip, element.nextSibling);
}

function createState(element: Element): TooltipDirectiveState {
	const tooltip = document.createElement('ml-tooltip') as TooltipHostElement;

	// The tooltip host holds no slotted trigger (the popup content is
	// position: fixed) — take it out of the layout flow so the extra sibling
	// never affects flex/grid/gap layouts around the element.
	tooltip.style.position = 'absolute';
	tooltip.style.width = '0';
	tooltip.style.height = '0';
	tooltip.style.overflow = 'visible';

	// Anchor the popup to the decorated element instead of the empty slot.
	tooltip.anchorEl = element as HTMLElement;

	const component = tooltip.component;
	const show: EventListener = () => {
		ensureInserted(element, tooltip);
		component?.show();
	};
	const hide: EventListener = () => {
		component?.hide();
	};

	// Same triggers ml-tooltip binds on its trigger wrapper. Escape-to-dismiss
	// is handled by the tooltip component itself while visible.
	element.addEventListener('mouseenter', show);
	element.addEventListener('mouseleave', hide);
	element.addEventListener('focusin', show);
	element.addEventListener('focusout', hide);

	const state: TooltipDirectiveState = { tooltip, pendingRemoval: false, ownsDescribedBy: false, show, hide };

	// Mirror ml-tooltip's slotted-trigger ARIA wiring: point the element's
	// aria-describedby at the tooltip content unless it already has one.
	const contentID = component?.tooltipID;
	if (contentID && !element.hasAttribute('aria-describedby')) {
		element.setAttribute('aria-describedby', contentID);
		state.ownsDescribedBy = true;
	}

	return state;
}

function destroyState(element: Element, state: TooltipDirectiveState): void {
	element.removeEventListener('mouseenter', state.show);
	element.removeEventListener('mouseleave', state.hide);
	element.removeEventListener('focusin', state.show);
	element.removeEventListener('focusout', state.hide);

	if (state.ownsDescribedBy) {
		element.removeAttribute('aria-describedby');
	}

	state.tooltip.anchorEl = null;
	// Disconnecting runs the tooltip component's onDestroy (timers, autoUpdate,
	// document listeners).
	state.tooltip.remove();

	if (tooltipStates.get(element) === state) {
		tooltipStates.delete(element);
	}
}

function tooltipDirective(element: Element, value: unknown): AttributeDirectiveCleanupFunction | void {
	if (!value) return;

	const { content, placement } = parseValue(value);
	if (!content) return;

	let state = tooltipStates.get(element);
	if (state) {
		// Value changed on re-render: adopt the live tooltip (cancels the
		// deferred removal scheduled by the previous cleanup) and update it.
		state.pendingRemoval = false;
	} else {
		state = createState(element);
		tooltipStates.set(element, state);
	}

	// Diff before writing: an object-form value (`{content, placement}`) is a
	// fresh reference every render, so the engine re-runs this directive even
	// when nothing changed — an unconditional setAttribute would fire the
	// tooltip's attributeChangedCallback each time.
	if (state.tooltip.getAttribute('content') !== content) {
		state.tooltip.setAttribute('content', content);
	}
	const resolvedPlacement = placement ?? 'top';
	if (state.tooltip.getAttribute('placement') !== resolvedPlacement) {
		state.tooltip.setAttribute('placement', resolvedPlacement);
	}
	ensureInserted(element, state.tooltip);

	const currentState = state;
	return () => {
		// The engine runs cleanup both when the value changes (the directive
		// re-runs synchronously right after) and when the part is disposed
		// (removal via when/repeat, host teardown). Defer teardown a microtask
		// so a same-tick re-run can adopt the tooltip instead of recreating it.
		currentState.pendingRemoval = true;
		queueMicrotask(() => {
			if (currentState.pendingRemoval) {
				destroyState(element, currentState);
			}
		});
	};
}

registerAttributeDirective('tooltip', tooltipDirective);

export { tooltipDirective };
