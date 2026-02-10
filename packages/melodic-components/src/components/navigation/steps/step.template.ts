import { html, classMap, when } from '@melodicdev/core';
import type { StepComponent } from './step.component.js';

export function stepTemplate(c: StepComponent) {
	const isBar = c.variant === 'bar';
	const isCompact = c.compact;

	return html`
		<div
			class=${classMap({
				'ml-step': true,
				[`ml-step--${c.status}`]: true,
				[`ml-step--${c.variant}`]: true,
				[`ml-step--${c.orientation}`]: true,
				[`ml-step--${c.color}`]: true,
				'ml-step--first': c.first,
				'ml-step--last': c.last,
				'ml-step--disabled': c.disabled,
				'ml-step--compact': isCompact
			})}
			role="tab"
			aria-selected=${c.status === 'current'}
			aria-disabled=${c.disabled}
			tabindex=${c.status === 'current' ? '0' : '-1'}
			@click=${c.handleClick}
		>
			${when(isBar, () => renderBarStep(c))}
			${when(!isBar && !isCompact, () => renderStandardStep(c))}
			${when(!isBar && isCompact, () => renderCompactStep(c))}
		</div>
	`;
}

function renderBarStep(c: StepComponent) {
	return html`
		<div class="ml-step__bar"></div>
		<div class="ml-step__content">
			<span class="ml-step__label">${c.label}</span>
			${when(!!c.description, () => html`<span class="ml-step__description">${c.description}</span>`)}
		</div>
	`;
}

function renderStandardStep(c: StepComponent) {
	return html`
		<div class="ml-step__track">
			<div class="ml-step__connector-before ${c.first ? 'ml-step__connector--hidden' : `ml-step__connector--${c.connector}`}"></div>
			<div class="ml-step__indicator">
				${renderIndicator(c)}
			</div>
			<div class="ml-step__connector-after ${c.last ? 'ml-step__connector--hidden' : `ml-step__connector--${c.connector}`}"></div>
		</div>
		<div class="ml-step__content">
			<span class="ml-step__label">${c.label}</span>
			${when(!!c.description, () => html`<span class="ml-step__description">${c.description}</span>`)}
		</div>
	`;
}

function renderCompactStep(_c: StepComponent) {
	return html`
		<div class="ml-step__dot"></div>
	`;
}

function renderIndicator(c: StepComponent) {
	switch (c.variant) {
		case 'numbered':
			return renderNumberedIndicator(c);
		case 'circles':
			return renderCirclesIndicator(c);
		case 'icons':
			return renderIconsIndicator(c);
		default:
			return renderNumberedIndicator(c);
	}
}

function renderNumberedIndicator(c: StepComponent) {
	const isCompleted = c.status === 'completed';
	return html`
		<div class="ml-step__indicator-inner ml-step__indicator-inner--numbered">
			${when(isCompleted, () => html`<ml-icon icon="check" size="sm"></ml-icon>`)}
			${when(!isCompleted, () => html`<span>${c['step-number']}</span>`)}
		</div>
	`;
}

function renderCirclesIndicator(c: StepComponent) {
	const isCompleted = c.status === 'completed';
	return html`
		<div class="ml-step__indicator-inner ml-step__indicator-inner--circles">
			${when(isCompleted, () => html`<ml-icon icon="check" size="sm"></ml-icon>`)}
			${when(!isCompleted, () => html`<div class="ml-step__indicator-dot"></div>`)}
		</div>
	`;
}

function renderIconsIndicator(c: StepComponent) {
	return html`
		<div class="ml-step__indicator-inner ml-step__indicator-inner--icons">
			<ml-icon icon=${c.icon || 'circle'} size="sm"></ml-icon>
		</div>
	`;
}
