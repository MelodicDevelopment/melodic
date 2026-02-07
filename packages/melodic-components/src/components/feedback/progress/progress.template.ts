import { html, classMap, styleMap, when } from '@melodicdev/core';
import type { ProgressComponent } from './progress.component.js';

export function progressTemplate(c: ProgressComponent) {
	return html`
		<div
			class=${classMap({
				'ml-progress': true,
				[`ml-progress--${c.variant}`]: true,
				[`ml-progress--${c.size}`]: true
			})}
		>
			${when(
				!!c.label || c.showValue,
				() => html`
					<div class="ml-progress__header">
						${when(!!c.label, () => html`<span class="ml-progress__label">${c.label}</span>`)}
						${when(c.showValue, () => html`<span class="ml-progress__value">${c.displayValue}</span>`)}
					</div>
				`
			)}
			<div class="ml-progress__track" role="progressbar" aria-valuenow=${c.value} aria-valuemin="0" aria-valuemax=${c.max} aria-label=${c.label || 'Progress'}>
				<div class="ml-progress__fill" style=${styleMap({ width: `${c.percentage}%` })}></div>
			</div>
		</div>
	`;
}
