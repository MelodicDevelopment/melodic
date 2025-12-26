import { MelodicComponent } from '@melodicdev/core/components';
import { html } from '@melodicdev/core/template';
import { signal } from '@melodicdev/core/signals';

@MelodicComponent({
	selector: 'app-root',
	template: (component: AppComponent) => html`
		<main>
			<h1>Melodic App</h1>
			<p>Clicks: ${component.count()}</p>
			<button @click=${component.increment}>Increment</button>
		</main>
	`
})
export class AppComponent {
	count = signal(0);

	increment = (): void => {
		this.count.update((value) => (value ?? 0) + 1);
	};
}
