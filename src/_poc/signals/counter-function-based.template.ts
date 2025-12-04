/**
 * Template for Function-Based Counter Component
 * Notice the cleaner syntax: count() instead of count.value
 */

import { html } from '../../template/template';
import type { CounterFunctionComponent } from './counter-function-based.component';

export function counterFunctionTemplate(component: CounterFunctionComponent) {
	return html`
		<div style="padding: 20px; font-family: sans-serif;">
			<!-- Notice: No .value needed! Just call the function -->
			<h2>${component.message()}</h2>

			<div style="margin: 20px 0; padding: 20px; background: #f0f0f0; border-radius: 8px;">
				<h3>Signal Values (Function-Based):</h3>
				<!-- Cleaner syntax compared to .value -->
				<p><strong>Count:</strong> ${component.count()}</p>
				<p><strong>Doubled:</strong> ${component.doubled()}</p>
				<p><strong>Tripled:</strong> ${component.tripled()}</p>
				<p><strong>Is Even:</strong> ${component.isEven() ? '✓ Yes' : '✗ No'}</p>
				<p><strong>Is Positive:</strong> ${component.isPositive() ? '✓ Yes' : '✗ No'}</p>
				<p><strong>Display Text:</strong> ${component.displayText()}</p>
			</div>

			<div style="margin: 20px 0;">
				<h3>Regular Property:</h3>
				<p><strong>Total Clicks:</strong> ${component.clicks}</p>
			</div>

			<div style="display: flex; gap: 10px; margin: 20px 0;">
				<button @click=${component.increment} style="padding: 10px 20px; cursor: pointer;">Increment (+1)</button>
				<button @click=${component.decrement} style="padding: 10px 20px; cursor: pointer;">Decrement (-1)</button>
				<button @click=${component.incrementByFive} style="padding: 10px 20px; cursor: pointer;">Add Five (+5)</button>
				<button @click=${component.reset} style="padding: 10px 20px; cursor: pointer; background: #ff4444; color: white; border: none;">Reset</button>
			</div>

			<div style="margin: 20px 0;">
				<label>
					Update Message:
					<input type="text" @input=${component.updateMessage} .value=${component.message()} style="margin-left: 10px; padding: 5px;" />
				</label>
			</div>

			<div style="margin-top: 30px; padding: 15px; background: #e8f4f8; border-left: 4px solid #0088cc;">
				<strong>Comparison:</strong>
				<ul style="margin: 10px 0; padding-left: 20px;">
					<li><strong>Property-based:</strong> <code>\${component.count.value}</code></li>
					<li><strong>Function-based:</strong> <code>\${component.count()}</code> ← Cleaner!</li>
				</ul>
			</div>
		</div>
	`;
}
