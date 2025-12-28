import { MelodicComponent } from '../../../../src/components';
import { html, css } from '../../../../src/template/functions/html.function';

@MelodicComponent({
	selector: 'framework-docs',
	template: () => html`
		<div class="page">
			<section class="hero">
				<p class="eyebrow">Documentation</p>
				<h1>Everything you need to build with Melodic.</h1>
				<p>Start with core concepts, then dive deeper into components, routing, signals, and state.</p>
			</section>

			<section class="grid">
				<article>
					<h2>Getting started</h2>
					<p>Install, bootstrap, and render your first component.</p>
					<ul>
						<li>Quickstart guide</li>
						<li>Project structure</li>
						<li>CLI tooling</li>
					</ul>
				</article>
				<article>
					<h2>Core concepts</h2>
					<p>Understand templates, styles, and the component lifecycle.</p>
					<ul>
						<li>Templates + directives</li>
						<li>Shadow DOM styling</li>
						<li>Lifecycle hooks</li>
					</ul>
				</article>
				<article>
					<h2>State + routing</h2>
					<p>Build multi-page flows with state, guards, and resolvers.</p>
					<ul>
						<li>Signals + reducers</li>
						<li>Router service</li>
						<li>Async data loading</li>
					</ul>
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

		.grid {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
			gap: 1.5rem;
		}

		article {
			background: var(--md-surface);
			padding: 1.8rem;
			border-radius: var(--md-radius-lg);
			box-shadow: var(--md-shadow-soft);
			border: 1px solid rgba(0, 157, 217, 0.12);
		}

		h2 {
			margin: 0 0 0.6rem;
			font-size: 1.4rem;
		}

		ul {
			margin: 1rem 0 0;
			padding: 0;
			list-style: none;
			display: grid;
			gap: 0.5rem;
			color: var(--md-ink-fade);
		}
	`
})
export class DocsPageComponent {}
