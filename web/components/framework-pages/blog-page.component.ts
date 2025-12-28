import { MelodicComponent } from '../../../src/components';
import { html, css } from '../../../src/template/functions/html.function';

@MelodicComponent({
	selector: 'alt-framework-blog',
	template: () => html`
		<div class="page">
			<section class="hero">
				<div class="hero-content">
					<span class="section-label">Blog</span>
					<h1>Framework updates</h1>
					<p class="hero-lead">Release notes, tutorials, and insights from the Melodic team.</p>
				</div>
			</section>

			<section class="posts">
				<div class="posts-grid">
					<article class="post-card featured">
						<div class="post-meta">
							<span class="post-tag">Release</span>
							<span class="post-date">Dec 20, 2024</span>
						</div>
						<h2>Melodic 1.0 is here</h2>
						<p>After months of development and testing, we're excited to announce the first stable release of Melodic Framework.</p>
						<a href="#" class="read-more">Read more</a>
					</article>

					<article class="post-card">
						<div class="post-meta">
							<span class="post-tag">Tutorial</span>
							<span class="post-date">Dec 15, 2024</span>
						</div>
						<h3>Understanding Reactive Properties</h3>
						<p>A deep dive into how Melodic's reactivity system works under the hood.</p>
						<a href="#" class="read-more">Read more</a>
					</article>

					<article class="post-card">
						<div class="post-meta">
							<span class="post-tag">Guide</span>
							<span class="post-date">Dec 10, 2024</span>
						</div>
						<h3>Migrating from React to Melodic</h3>
						<p>A practical guide for React developers looking to try Melodic.</p>
						<a href="#" class="read-more">Read more</a>
					</article>

					<article class="post-card">
						<div class="post-meta">
							<span class="post-tag">Performance</span>
							<span class="post-date">Dec 5, 2024</span>
						</div>
						<h3>Why We Chose Direct DOM Over Virtual DOM</h3>
						<p>The performance benefits of skipping the virtual DOM abstraction.</p>
						<a href="#" class="read-more">Read more</a>
					</article>
				</div>
			</section>
		</div>
	`,
	styles: () => css`
		.page {
			display: flex;
			flex-direction: column;
		}

		.hero {
			background: var(--alt-gray-50);
			padding: 6rem 2rem;
			text-align: center;
		}

		.hero-content {
			max-width: 720px;
			margin: 0 auto;
		}

		.section-label {
			display: inline-block;
			font-size: 0.875rem;
			font-weight: 600;
			color: #06b6d4;
			text-transform: uppercase;
			letter-spacing: 0.1em;
			margin-bottom: 0.75rem;
		}

		.hero h1 {
			font-family: var(--alt-font-display);
			font-size: clamp(2.5rem, 5vw, 3.25rem);
			font-weight: 700;
			color: var(--alt-gray-900);
			margin: 0 0 1.5rem;
		}

		.hero-lead {
			font-size: 1.25rem;
			color: var(--alt-gray-600);
			margin: 0;
		}

		.posts {
			max-width: 900px;
			margin: 0 auto;
			padding: 6rem 2rem;
		}

		.posts-grid {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
			gap: 1.5rem;
		}

		.post-card {
			background: var(--alt-white);
			padding: 2rem;
			border-radius: var(--alt-radius-lg);
			border: 1px solid var(--alt-gray-200);
			transition: all var(--alt-transition-base);
		}

		.post-card:hover {
			border-color: rgba(6, 182, 212, 0.4);
			box-shadow: var(--alt-shadow-md);
		}

		.post-card.featured {
			grid-column: 1 / -1;
			background: var(--alt-gradient-dark);
			border: none;
		}

		.post-meta {
			display: flex;
			align-items: center;
			gap: 1rem;
			margin-bottom: 1rem;
		}

		.post-tag {
			font-size: 0.75rem;
			font-weight: 600;
			color: #06b6d4;
			text-transform: uppercase;
			letter-spacing: 0.05em;
			padding: 0.25rem 0.625rem;
			background: rgba(6, 182, 212, 0.1);
			border-radius: var(--alt-radius-full);
		}

		.post-card.featured .post-tag {
			background: var(--alt-gray-800);
		}

		.post-date {
			font-size: 0.875rem;
			color: var(--alt-gray-500);
		}

		.post-card.featured .post-date {
			color: var(--alt-gray-400);
		}

		.post-card h2 {
			font-family: var(--alt-font-display);
			font-size: 1.75rem;
			font-weight: 700;
			color: var(--alt-white);
			margin: 0 0 1rem;
		}

		.post-card h3 {
			font-size: 1.25rem;
			font-weight: 600;
			color: var(--alt-gray-900);
			margin: 0 0 0.75rem;
		}

		.post-card p {
			font-size: 1rem;
			line-height: 1.6;
			color: var(--alt-gray-600);
			margin: 0 0 1.5rem;
		}

		.post-card.featured p {
			font-size: 1.125rem;
			color: var(--alt-gray-400);
		}

		.read-more {
			font-size: 0.9375rem;
			font-weight: 600;
			color: #06b6d4;
		}

		.read-more:hover {
			text-decoration: underline;
		}

		@media (max-width: 640px) {
			.hero,
			.posts {
				padding: 4rem 1.25rem;
			}
		}
	`
})
export class AltFrameworkBlogPageComponent {}
