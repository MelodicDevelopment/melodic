import { css, html } from '../../../src';
import { MelodicComponent } from '../../../src/components/melodic-component.decorator';
import type { IElementRef } from '../../../src/components/interfaces/ielement-ref.interface';
import { signal } from '../../../src/signals/functions/signal.function';

@MelodicComponent({
	selector: 'test-component',
	template: (self: TestComponent) => html`
		<div class="test-container">
			<h3>Test Component (Independent State)</h3>
			<p class="label">Label from parent: <strong>${self.label}</strong></p>
			<p>Local count: ${self.count()}</p>
			<button @click="${self.increment}">Increment</button>
			<button @click="${self.decrement}">Decrement</button>
			<button @click="${self.reset}">Reset</button>
		</div>
	`,
	styles: () => css`
		.test-container {
			padding: 1rem;
			border: 2px solid #4caf50;
			border-radius: 8px;
			margin: 1rem 0;
			background: #f9fff9;
		}
		h3 {
			margin: 0 0 0.5rem 0;
			color: #4caf50;
		}
		.label {
			color: #666;
			margin: 0.5rem 0;
		}
		.label strong {
			color: #333;
		}
		button {
			margin-right: 0.5rem;
			padding: 0.5rem 1rem;
			border: none;
			border-radius: 4px;
			background: #4caf50;
			color: white;
			cursor: pointer;
		}
		button:hover {
			background: #45a049;
		}
	`,
	attributes: ['label']
})
export class TestComponent implements IElementRef {
	elementRef!: HTMLElement;

	// Property passed from parent via attribute
	label = 'Default Label';

	// Local state using signal
	count = signal(0);

	increment = () => {
		this.count.update((n) => n + 1);
	};

	decrement = () => {
		this.count.update((n) => n - 1);
	};

	reset = () => {
		this.count.set(0);
	};
}
