import { MelodicComponent } from '../../../../src/components';
import { html, css } from '../../../../src/template/functions/html.function';

@MelodicComponent({
	selector: 'company-blog',
	template: () => html`
		<div class="page">
			<section class="hero">
				<p class="eyebrow">Insights</p>
				<h1>Field notes from product, design, and engineering.</h1>
				<p>Short, practical perspectives on shipping modern software.</p>
			</section>

			<section class="posts">
				<article>
					<p class="date">Dec 12, 2024</p>
					<h2>Designing operational dashboards that teams actually use</h2>
					<p>How to turn data into decisions with clear hierarchy and crisp interaction patterns.</p>
					<a class="link" href="/">Read article</a>
				</article>
				<article>
					<p class="date">Nov 26, 2024</p>
					<h2>From roadmap to release: tightening the MVP cycle</h2>
					<p>Lessons from compressing MVP timelines while protecting quality.</p>
					<a class="link" href="/">Read article</a>
				</article>
				<article>
					<p class="date">Oct 30, 2024</p>
					<h2>Why we built the Melodic Framework</h2>
					<p>Lightweight components, predictable state, and composable UI primitives.</p>
					<a class="link" href="/">Read article</a>
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
			padding: 2rem;
			border-radius: var(--md-radius-lg);
			box-shadow: var(--md-shadow-soft);
			border: 1px solid rgba(73, 33, 109, 0.1);
			display: grid;
			gap: 0.8rem;
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

		.link {
			font-weight: 700;
			color: var(--md-purple);
		}
	`
})
export class BlogPageComponent {}
