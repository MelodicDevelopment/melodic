import { html, classMap, styleMap, when } from '@melodicdev/core';
import type { ProgressComponent } from './progress.component.js';

function linearTemplate(c: ProgressComponent) {
	const showHeader = c.labelPosition === 'top' && (!!c.label || c.showValue);
	const showRight = c.labelPosition === 'right' && c.showValue;
	const showBottom = c.labelPosition === 'bottom' && c.showValue;
	const showFloatingTop = c.labelPosition === 'floating-top' && c.showValue;
	const showFloatingBottom = c.labelPosition === 'floating-bottom' && c.showValue;

	return html`
		<div class=${classMap({
			'ml-progress': true,
			[`ml-progress--${c.variant}`]: true,
			[`ml-progress--${c.size}`]: true,
			'ml-progress--label-right': showRight
		})}>
			${when(showHeader, () => html`
				<div class="ml-progress__header">
					${when(!!c.label, () => html`<span class="ml-progress__label">${c.label}</span>`)}
					${when(c.showValue, () => html`<span class="ml-progress__value">${c.displayValue}</span>`)}
				</div>
			`)}

			<div class="ml-progress__bar-row">
				<div class="ml-progress__track-wrapper">
					${when(showFloatingTop, () => html`
						<div class="ml-progress__floating ml-progress__floating--top" style=${styleMap({ left: `${c.percentage}%` })}>
							<span class="ml-progress__floating-value">${c.displayValue}</span>
							<span class="ml-progress__floating-arrow ml-progress__floating-arrow--down"></span>
						</div>
					`)}

					<div class="ml-progress__track" role="progressbar" aria-valuenow=${c.value} aria-valuemin="0" aria-valuemax=${c.max} aria-label=${c.label || 'Progress'}>
						<div class="ml-progress__fill" style=${styleMap({ width: `${c.percentage}%` })}></div>
					</div>

					${when(showFloatingBottom, () => html`
						<div class="ml-progress__floating ml-progress__floating--bottom" style=${styleMap({ left: `${c.percentage}%` })}>
							<span class="ml-progress__floating-arrow ml-progress__floating-arrow--up"></span>
							<span class="ml-progress__floating-value">${c.displayValue}</span>
						</div>
					`)}
				</div>

				${when(showRight, () => html`<span class="ml-progress__value">${c.displayValue}</span>`)}
			</div>

			${when(showBottom, () => html`<span class="ml-progress__value ml-progress__value--bottom">${c.displayValue}</span>`)}
		</div>
	`;
}

function circleTemplate(c: ProgressComponent) {
	return html`
		<div class=${classMap({
			'ml-progress-circle': true,
			[`ml-progress-circle--${c.variant}`]: true,
			[`ml-progress-circle--${c.size}`]: true
		})}>
			<svg
				width=${c.svgSize}
				height=${c.svgSize}
				viewBox="0 0 ${c.svgSize} ${c.svgSize}"
				class="ml-progress-circle__svg"
			>
				<circle
					class="ml-progress-circle__track"
					cx=${c.svgCenter}
					cy=${c.svgCenter}
					r=${c.circleRadius}
					fill="none"
					stroke-width=${c.circleStroke}
				/>
				<circle
					class="ml-progress-circle__fill"
					cx=${c.svgCenter}
					cy=${c.svgCenter}
					r=${c.circleRadius}
					fill="none"
					stroke-width=${c.circleStroke}
					stroke-linecap="round"
					stroke-dasharray=${c.circumference}
					stroke-dashoffset=${c.circleDashOffset}
					transform="rotate(-90 ${c.svgCenter} ${c.svgCenter})"
				/>
			</svg>
			${when(c.showValue || !!c.label, () => html`
				<div class="ml-progress-circle__center">
					${when(c.showValue, () => html`<span class="ml-progress-circle__value">${c.displayValue}</span>`)}
					${when(!!c.label, () => html`<span class="ml-progress-circle__label">${c.label}</span>`)}
				</div>
			`)}
		</div>
	`;
}

function halfCircleTemplate(c: ProgressComponent) {
	return html`
		<div class=${classMap({
			'ml-progress-half': true,
			[`ml-progress-half--${c.variant}`]: true,
			[`ml-progress-half--${c.size}`]: true
		})}>
			<svg
				width=${c.svgSize}
				height=${c.svgCenter + c.circleStroke}
				viewBox="0 0 ${c.svgSize} ${c.svgCenter + c.circleStroke}"
				class="ml-progress-half__svg"
			>
				<path
					class="ml-progress-half__track"
					d="M ${c.circleStroke} ${c.svgCenter} A ${c.circleRadius} ${c.circleRadius} 0 0 1 ${c.svgSize - c.circleStroke} ${c.svgCenter}"
					fill="none"
					stroke-width=${c.circleStroke}
					stroke-linecap="round"
				/>
				<path
					class="ml-progress-half__fill"
					d="M ${c.circleStroke} ${c.svgCenter} A ${c.circleRadius} ${c.circleRadius} 0 0 1 ${c.svgSize - c.circleStroke} ${c.svgCenter}"
					fill="none"
					stroke-width=${c.circleStroke}
					stroke-linecap="round"
					stroke-dasharray=${c.halfCircumference}
					stroke-dashoffset=${c.halfCircleDashOffset}
				/>
			</svg>
			${when(c.showValue || !!c.label, () => html`
				<div class="ml-progress-half__center">
					${when(c.showValue, () => html`<span class="ml-progress-half__value">${c.displayValue}</span>`)}
					${when(!!c.label, () => html`<span class="ml-progress-half__label">${c.label}</span>`)}
				</div>
			`)}
		</div>
	`;
}

export function progressTemplate(c: ProgressComponent) {
	if (c.shape === 'circle') return circleTemplate(c);
	if (c.shape === 'half-circle') return halfCircleTemplate(c);
	return linearTemplate(c);
}
