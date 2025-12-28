import { MelodicComponent } from '../../../../src/components';
import { html, css } from '../../../../src/template/functions/html.function';

@MelodicComponent({
	selector: 'framework-tutorials',
	template: () => html`
		<div class="page">
			<section class="hero">
				<p class="eyebrow">Tutorials</p>
				<h1>Guided builds for real-world use cases.</h1>
				<p>Follow step-by-step tutorials that mirror how teams ship production apps.</p>
			</section>

			<section class="list">
				<article>
					<h2>Build a marketing site</h2>
					<p>Create a multi-page site with shared layouts and a clean design system.</p>
				</article>
				<article>
					<h2>Dashboard with routing</h2>
					<p>Set up nested routes, guards, and lazy-loaded views.</p>
				</article>
				<article>
					<h2>Signals + state</h2>
					<p>Manage global state with reducers and signals that update predictably.</p>
				</article>
			</section>
		</div>
	`,
	styles: () => css`
		.page {
			display: grid;
			gap: 3rem;
		}

		.hero {
			max-width: 720px;
		}

		.eyebrow {
			text-transform: uppercase;
			letter-spacing: 0.2em;
			font-size: 0.75rem;
			color: var(--md-ink-fade);
			margin: 0 0 0.8rem;
		}

		h1 {
			font-family: var(--md-font-display);
			font-size: clamp(2.3rem, 3vw, 3rem);
			margin: 0 0 1rem;
		}

		p {
			margin: 0;
			line-height: 1.7;
			color: var(--md-ink-soft);
		}

		.list {
			display: grid;
			gap: 1rem;
		}

		article {
			background: rgba(255, 255, 255, 0.7);
			padding: 1.5rem;
			border-radius: var(--md-radius-md);
			border: 1px solid rgba(0, 157, 217, 0.12);
		}

		h2 {
			margin: 0 0 0.4rem;
			font-size: 1.3rem;
		}
	`
})
export class TutorialsPageComponent {}
