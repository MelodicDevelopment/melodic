import { html, classMap, repeat, when } from '@melodicdev/core';
import type { StepsComponent } from './steps.component.js';
import type { StepConfig } from './steps.types.js';

export function stepsTemplate(c: StepsComponent) {
	const hasSteps = c.steps.length > 0;
	const isCompact = c.compact;

	return html`
		<div
			class=${classMap({
				'ml-steps': true,
				[`ml-steps--${c.variant}`]: true,
				[`ml-steps--${c.orientation}`]: true,
				'ml-steps--compact': isCompact
			})}
		>
			<div
				class="ml-steps__list"
				role="tablist"
				aria-orientation=${c.orientation}
				@keydown=${c.handleKeyDown}
			>
				${hasSteps
					? repeat(
							c.steps,
							(step) => `${step.value}-${c.active === step.value}`,
							(step, index) => renderConfigStep(c, step, index)
						)
					: html`<slot name="step" @slotchange=${c.handleStepSlotChange}></slot>`}
			</div>

			${when(isCompact, () => html`
				<div class="ml-steps__compact-label">
					Step ${c.getCurrentStepNumber()} of ${c.getTotalSteps()}
				</div>
			`)}

			<div class="ml-steps__panels">
				<slot></slot>
			</div>
		</div>
	`;
}

function renderConfigStep(c: StepsComponent, step: StepConfig, index: number) {
	const allSteps = c.steps;
	const isFirst = index === 0;
	const isLast = index === allSteps.length - 1;
	const status = c.getStepStatus(step.value);
	const isBar = c.variant === 'bar';
	const isCompact = c.compact;

	return html`
		<div
			class=${classMap({
				'ml-step': true,
				[`ml-step--${status}`]: true,
				[`ml-step--${c.variant}`]: true,
				[`ml-step--${c.orientation}`]: true,
				[`ml-step--${c.color}`]: true,
				'ml-step--first': isFirst,
				'ml-step--last': isLast,
				'ml-step--disabled': !!step.disabled,
				'ml-step--compact': isCompact
			})}
			role="tab"
			data-value=${step.value}
			aria-selected=${status === 'current'}
			aria-disabled=${step.disabled || false}
			tabindex=${status === 'current' ? '0' : '-1'}
			@click=${() => c.handleStepClick(step.value, step.href)}
		>
			${when(isBar, () => renderBarStep(c, step))}
			${when(!isBar && !isCompact, () => renderStandardStep(c, step, index, isFirst, isLast, status))}
			${when(!isBar && isCompact, () => renderCompactDot(c, status))}
		</div>
	`;
}

function renderBarStep(_c: StepsComponent, step: StepConfig) {
	return html`
		<div class="ml-step__bar"></div>
		<div class="ml-step__content">
			<span class="ml-step__label">${step.label}</span>
			${when(!!step.description, () => html`<span class="ml-step__description">${step.description}</span>`)}
		</div>
	`;
}

function renderStandardStep(c: StepsComponent, step: StepConfig, index: number, isFirst: boolean, isLast: boolean, status: string) {
	return html`
		<div class="ml-step__track">
			<div class="ml-step__connector-before ${isFirst ? 'ml-step__connector--hidden' : `ml-step__connector--${c.connector}`}"></div>
			<div class="ml-step__indicator">
				${renderConfigIndicator(c, step, index, status)}
			</div>
			<div class="ml-step__connector-after ${isLast ? 'ml-step__connector--hidden' : `ml-step__connector--${c.connector}`}"></div>
		</div>
		<div class="ml-step__content">
			<span class="ml-step__label">${step.label}</span>
			${when(!!step.description, () => html`<span class="ml-step__description">${step.description}</span>`)}
		</div>
	`;
}

function renderCompactDot(_c: StepsComponent, _status: string) {
	return html`<div class="ml-step__dot"></div>`;
}

function renderConfigIndicator(c: StepsComponent, step: StepConfig, index: number, status: string) {
	switch (c.variant) {
		case 'numbered':
			return html`
				<div class="ml-step__indicator-inner ml-step__indicator-inner--numbered">
					${when(status === 'completed', () => html`<ml-icon icon="check" size="sm"></ml-icon>`)}
					${when(status !== 'completed', () => html`<span>${index + 1}</span>`)}
				</div>
			`;
		case 'circles':
			return html`
				<div class="ml-step__indicator-inner ml-step__indicator-inner--circles">
					${when(status === 'completed', () => html`<ml-icon icon="check" size="sm"></ml-icon>`)}
					${when(status !== 'completed', () => html`<div class="ml-step__indicator-dot"></div>`)}
				</div>
			`;
		case 'icons':
			return html`
				<div class="ml-step__indicator-inner ml-step__indicator-inner--icons">
					<ml-icon icon=${step.icon || 'circle'} size="sm"></ml-icon>
				</div>
			`;
		default:
			return html``;
	}
}
