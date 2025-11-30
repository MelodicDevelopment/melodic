/**
 * Template for Counter Component
 * Demonstrates accessing signal values in templates
 */

import { html } from '../template/template';
import type { CounterComponent } from './counter.component';

export function counterTemplate(component: CounterComponent) {
	return html`
		<div style="padding: 20px; font-family: sans-serif;">
			<h2>${component.message.value}</h2>

			<div style="margin: 20px 0; padding: 20px; background: #f0f0f0; border-radius: 8px;">
				<h3>Signal Values:</h3>
				<p><strong>Count:</strong> ${component.count.value}</p>
				<p><strong>Doubled:</strong> ${component.doubled.value}</p>
				<p><strong>Tripled:</strong> ${component.tripled.value}</p>
				<p><strong>Is Even:</strong> ${component.isEven.value ? '✓ Yes' : '✗ No'}</p>
				<p><strong>Is Positive:</strong> ${component.isPositive.value ? '✓ Yes' : '✗ No'}</p>
				<p><strong>Display Text:</strong> ${component.displayText.value}</p>
			</div>

			<div style="margin: 20px 0;">
				<h3>Regular Property:</h3>
				<p><strong>Total Clicks:</strong> ${component.clicks}</p>
			</div>

			<div style="display: flex; gap: 10px; margin: 20px 0;">
				<button @click=${component.increment} style="padding: 10px 20px; cursor: pointer;">
					Increment (+1)
				</button>
				<button @click=${component.decrement} style="padding: 10px 20px; cursor: pointer;">
					Decrement (-1)
				</button>
				<button @click=${component.incrementByFive} style="padding: 10px 20px; cursor: pointer;">
					Add Five (+5)
				</button>
				<button @click=${component.reset} style="padding: 10px 20px; cursor: pointer; background: #ff4444; color: white; border: none;">
					Reset
				</button>
			</div>

			<div style="margin: 20px 0;">
				<label>
					Update Message:
					<input type="text" @input=${component.updateMessage} .value=${component.message.value} style="margin-left: 10px; padding: 5px;" />
				</label>
			</div>

			<div style="margin-top: 30px; padding: 15px; background: #e8f4f8; border-left: 4px solid #0088cc;">
				<strong>Note:</strong> All signal values update automatically! Computed signals recalculate when their dependencies change.
			</div>
		</div>
	`;
}
