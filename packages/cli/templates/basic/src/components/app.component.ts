import { MelodicComponent } from '@melodic/core/components';
import { html } from '@melodic/core/template';
import { signal } from '@melodic/core/signals';

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
