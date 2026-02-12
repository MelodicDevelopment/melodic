import { registerAttributeDirective } from '@melodicdev/core/template';
import type { AttributeDirectiveCleanupFunction } from '@melodicdev/core/template';

/**
 * Tooltip attribute directive - Wraps an element with an ml-tooltip component
 *
 * Usage:
 * ```html
 * <!-- Static content -->
 * <div :tooltip="Helpful tip">Hover me</div>
 *
 * <!-- Dynamic content -->
 * <ml-button :tooltip=${this.helpText}>Help</ml-button>
 *
 * <!-- With placement (defaults to "top") -->
 * <span :tooltip=${{ content: 'Info', placement: 'bottom' }}>Info</span>
 * ```
 */

export interface TooltipDirectiveOptions {
	content: string;
	placement?: string;
}

function parseValue(value: unknown): TooltipDirectiveOptions {
	if (typeof value === 'string') {
		return { content: value };
	}

	if (value && typeof value === 'object' && 'content' in value) {
		return value as TooltipDirectiveOptions;
	}

	return { content: String(value ?? '') };
}

function tooltipDirective(element: Element, value: unknown): AttributeDirectiveCleanupFunction | void {
	if (!value) return;

	const { content, placement } = parseValue(value);
	if (!content) return;

	// Create ml-tooltip wrapper and move element into it
	const tooltip = document.createElement('ml-tooltip');
	tooltip.setAttribute('content', content);
	if (placement) {
		tooltip.setAttribute('placement', placement);
	}

	element.parentNode?.insertBefore(tooltip, element);
	tooltip.appendChild(element);

	return () => {
		tooltip.parentNode?.insertBefore(element, tooltip);
		tooltip.remove();
	};
}

registerAttributeDirective('tooltip', tooltipDirective);

export { tooltipDirective };
