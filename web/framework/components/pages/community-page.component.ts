import { MelodicComponent } from '../../../../src/components';
import { html, css } from '../../../../src/template/functions/html.function';

@MelodicComponent({
	selector: 'framework-community',
	template: () => html`
		<div class="page">
			<section class="hero">
				<p class="eyebrow">Community</p>
				<h1>Join the builders shaping Melodic.</h1>
				<p>Contribute, share feedback, and help guide the framework roadmap.</p>
			</section>

			<section class="cards">
				<article>
					<h2>Contribute</h2>
					<p>Open issues, improve docs, or ship new examples.</p>
					<a class="link" href="https://github.com/MelodicDevelopment/melodic" target="_blank" rel="noreferrer">GitHub repo</a>
				</article>
				<article>
					<h2>Share feedback</h2>
					<p>Let us know what is working and where we can improve.</p>
					<a class="link" href="/framework/docs">Submit feedback</a>
				</article>
				<article>
					<h2>Showcase</h2>
					<p>Built something with Melodic? We would love to feature it.</p>
					<a class="link" href="/framework/docs">Send your project</a>
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
			gap: 0.8rem;
		}

		h2 {
			margin: 0;
			font-size: 1.4rem;
		}

		.link {
			font-weight: 700;
			color: var(--md-blue);
		}
	`
})
export class CommunityPageComponent {}
