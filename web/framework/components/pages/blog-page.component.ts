import { MelodicComponent } from '../../../../src/components';
import { html, css } from '../../../../src/template/functions/html.function';

@MelodicComponent({
	selector: 'framework-blog',
	template: () => html`
		<div class="page">
			<section class="hero">
				<p class="eyebrow">Blog</p>
				<h1>Releases, patterns, and component thinking.</h1>
				<p>Updates on the framework and the ideas behind it.</p>
			</section>

			<section class="posts">
				<article>
					<p class="date">Dec 08, 2024</p>
					<h2>Melodic 0.4: Routing and resolvers</h2>
					<p>A new router experience with cleaner APIs and typed route data.</p>
				</article>
				<article>
					<p class="date">Nov 19, 2024</p>
					<h2>Designing component APIs that stay small</h2>
					<p>How we keep the surface area lean while still flexible.</p>
				</article>
				<article>
					<p class="date">Oct 10, 2024</p>
					<h2>Building documentation for DX</h2>
					<p>A look at the new docs architecture and content plan.</p>
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

		.posts {
			display: grid;
			gap: 1.5rem;
		}

		article {
			background: var(--md-surface);
			padding: 1.8rem;
			border-radius: var(--md-radius-lg);
			box-shadow: var(--md-shadow-soft);
			border: 1px solid rgba(0, 157, 217, 0.12);
			display: grid;
			gap: 0.6rem;
		}

		.date {
			text-transform: uppercase;
			letter-spacing: 0.18em;
			font-size: 0.7rem;
			color: var(--md-ink-fade);
		}

		h2 {
			margin: 0;
			font-size: 1.5rem;
		}
	`
})
export class BlogPageComponent {}
