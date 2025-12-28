import { MelodicComponent } from '../../../../src/components';
import { html, css } from '../../../../src/template/functions/html.function';

@MelodicComponent({
	selector: 'framework-download',
	template: () => html`
		<div class="page">
			<section class="hero">
				<p class="eyebrow">Download</p>
				<h1>Install Melodic in minutes.</h1>
				<p>Use npm, or grab the starter project to bootstrap immediately.</p>
			</section>

			<section class="cards">
				<article>
					<h2>npm package</h2>
					<p>Install the core framework and start building.</p>
					<pre><code>npm i @melodicdev/core</code></pre>
				</article>
				<article>
					<h2>Starter kit</h2>
					<p>Clone the starter repo with routing, state, and layout presets.</p>
					<pre><code>npx melodic create my-app</code></pre>
				</article>
				<article>
					<h2>Changelog</h2>
					<p>Stay current with new features and updates.</p>
					<a class="link" href="https://github.com/MelodicDevelopment/melodic" target="_blank" rel="noreferrer">View releases</a>
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
			color: var(--md-ink-soft);
			line-height: 1.7;
		}

		.cards {
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
			display: grid;
			gap: 0.75rem;
		}

		pre {
			margin: 0;
			padding: 0.8rem 1rem;
			background: #0f1627;
			color: #e8f3ff;
			border-radius: 12px;
			font-family: 'SFMono-Regular', 'Menlo', monospace;
			font-size: 0.85rem;
		}

		.link {
			font-weight: 700;
			color: var(--md-blue);
		}
	`
})
export class DownloadPageComponent {}
