import { css, html } from '../../../../src';
import type { OnAttributeChange } from '../../../../src/components';
import { MelodicComponent } from '../../../../src/components';
import { signal } from '../../../../src/signals/functions/signal.function';

@MelodicComponent({
	selector: 'test-component',
	template: (self: TestComponent, attributes?: Record<string, string>) => html`
		<div class="test-container">
			<h3>Test Component (Independent State)</h3>
			<p class="label">Label from parent: <strong>${self.label}</strong></p>
			<p>Local count: ${self.count()}</p>
			<button @click="${self.increment}">Increment</button>
			<button @click="${self.decrement}">Decrement</button>
			<button @click="${self.reset}">Reset</button>
			<p>Title from attribute: ${attributes?.title}</p>
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
	attributes: ['title']
})
export class TestComponent implements OnAttributeChange {
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

	onAttributeChange(attribute: string, oldVal: unknown, newVal: unknown): void {
		console.log(`Attribute changed: ${attribute} from "${oldVal}" to "${newVal}"`);
	}
}
