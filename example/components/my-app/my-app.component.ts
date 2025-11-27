import { MelodicComponent, html } from '../../../src/index';

@MelodicComponent({
	selector: 'my-app',
	template: (component: MyApp) => html`
		<div class="container">
			<h1>${component.title}</h1>
			<p>Count: ${component.count}</p>
			<button @click=${component.increment}>Increment</button>
			<button @click=${component.reset}>Reset</button>

			<hr />

			<input type="text" .value=${component.message} @input=${component.updateMessage} placeholder="Type something..." />
			<p>You typed: ${component.message}</p>
		</div>
	`,
	styles: () => `
		.container {
			padding: 20px;
			font-family: system-ui, -apple-system, sans-serif;
		}

		button {
			margin: 5px;
			padding: 8px 16px;
			border: none;
			border-radius: 4px;
			background: #007bff;
			color: white;
			cursor: pointer;
			font-size: 14px;
		}

		button:hover {
			background: #0056b3;
		}

		input {
			padding: 8px;
			border: 1px solid #ccc;
			border-radius: 4px;
			font-size: 14px;
			width: 300px;
		}

		hr {
			margin: 20px 0;
			border: none;
			border-top: 1px solid #eee;
		}
	`
})
export class MyApp {
	title = 'Melodic Component Demo';
	count = 0;
	message = '';

	increment = () => {
		console.log('Incrementing count');
		this.count++;
	};

	reset = () => {
		this.count = 0;
	};

	updateMessage = (e: Event) => {
		this.message = (e.target as HTMLInputElement).value;
	};
}
