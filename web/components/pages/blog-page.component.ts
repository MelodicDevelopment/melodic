import { MelodicComponent } from '../../../src/components';
import { html, css } from '../../../src/template/functions/html.function';

@MelodicComponent({
	selector: 'alt-blog',
	template: () => html`
		<div class="page">
			<section class="hero">
				<div class="hero-content">
					<span class="section-label">Blog</span>
					<h1>Thoughts on building software</h1>
					<p class="hero-lead">Engineering insights, architectural decisions, and lessons from the trenches.</p>
				</div>
			</section>

			<section class="posts">
				<div class="posts-grid">
					<article class="post-card featured">
						<div class="post-meta">
							<span class="post-category">Architecture</span>
							<span class="post-date">Dec 15, 2024</span>
						</div>
						<h2>Why We Built Our Own Framework</h2>
						<p>
							After years of working with React, Vue, and Angular, we decided to build Melodic. Here's why we think web components are the future.
						</p>
						<div class="post-footer">
							<div class="author">
								<div class="author-avatar">RH</div>
								<span class="author-name">Rick Hopkins</span>
							</div>
							<span class="read-time">8 min read</span>
						</div>
					</article>

					<article class="post-card">
						<div class="post-meta">
							<span class="post-category">Performance</span>
							<span class="post-date">Dec 8, 2024</span>
						</div>
						<h3>Template Literals: Parse Once, Update Forever</h3>
						<p>How Melodic's template system achieves near-native performance without a virtual DOM.</p>
						<div class="post-footer">
							<span class="read-time">5 min read</span>
						</div>
					</article>

					<article class="post-card">
						<div class="post-meta">
							<span class="post-category">DevOps</span>
							<span class="post-date">Nov 28, 2024</span>
						</div>
						<h3>Zero-Downtime Deployments with Kubernetes</h3>
						<p>A practical guide to rolling deployments, health checks, and graceful shutdowns.</p>
						<div class="post-footer">
							<span class="read-time">12 min read</span>
						</div>
					</article>

					<article class="post-card">
						<div class="post-meta">
							<span class="post-category">TypeScript</span>
							<span class="post-date">Nov 15, 2024</span>
						</div>
						<h3>Decorators Done Right</h3>
						<p>Implementing type-safe decorators with full IntelliSense support.</p>
						<div class="post-footer">
							<span class="read-time">6 min read</span>
						</div>
					</article>

					<article class="post-card">
						<div class="post-meta">
							<span class="post-category">Testing</span>
							<span class="post-date">Nov 2, 2024</span>
						</div>
						<h3>Testing Web Components Without the Pain</h3>
						<p>Unit testing Shadow DOM, custom events, and component lifecycles.</p>
						<div class="post-footer">
							<span class="read-time">7 min read</span>
						</div>
					</article>

					<article class="post-card">
						<div class="post-meta">
							<span class="post-category">Architecture</span>
							<span class="post-date">Oct 20, 2024</span>
						</div>
						<h3>Signals vs. Observables: A Deep Dive</h3>
						<p>Comparing reactive primitives and when to use each approach.</p>
						<div class="post-footer">
							<span class="read-time">10 min read</span>
						</div>
					</article>
				</div>
			</section>

			<section class="newsletter">
				<div class="newsletter-inner">
					<div class="newsletter-content">
						<h2>Stay in the loop</h2>
						<p>Get notified when we publish new articles. No spam, unsubscribe anytime.</p>
					</div>
					<form class="newsletter-form">
						<input type="email" placeholder="you@example.com" required />
						<button type="submit" class="btn btn-primary">Subscribe</button>
					</form>
				</div>
			</section>
		</div>
	`,
	styles: () => css`
		.page {
			display: flex;
			flex-direction: column;
		}

		/* Hero */
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
			color: var(--alt-primary);
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
			line-height: 1.6;
			color: var(--alt-gray-600);
			margin: 0;
		}

		/* Posts */
		.posts {
			max-width: 1000px;
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
			padding: 1.75rem;
			border-radius: var(--alt-radius-lg);
			border: 1px solid var(--alt-gray-200);
			transition: all var(--alt-transition-base);
			cursor: pointer;
		}

		.post-card:hover {
			border-color: var(--alt-primary-light);
			box-shadow: var(--alt-shadow-md);
			transform: translateY(-4px);
		}

		.post-card.featured {
			grid-column: 1 / -1;
			padding: 2.5rem;
			background: var(--alt-gradient-dark);
			border: none;
		}

		.post-meta {
			display: flex;
			align-items: center;
			gap: 1rem;
			margin-bottom: 1rem;
		}

		.post-category {
			font-size: 0.75rem;
			font-weight: 600;
			color: var(--alt-primary);
			text-transform: uppercase;
			letter-spacing: 0.05em;
			padding: 0.25rem 0.625rem;
			background: rgba(124, 58, 237, 0.1);
			border-radius: var(--alt-radius-full);
		}

		.post-card.featured .post-category {
			background: var(--alt-gray-800);
			color: var(--alt-primary-light);
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

		.post-footer {
			display: flex;
			align-items: center;
			justify-content: space-between;
		}

		.author {
			display: flex;
			align-items: center;
			gap: 0.75rem;
		}

		.author-avatar {
			width: 36px;
			height: 36px;
			display: flex;
			align-items: center;
			justify-content: center;
			background: var(--alt-gradient-primary);
			border-radius: 50%;
			font-size: 0.75rem;
			font-weight: 600;
			color: var(--alt-white);
		}

		.author-name {
			font-size: 0.9375rem;
			font-weight: 500;
			color: var(--alt-gray-300);
		}

		.read-time {
			font-size: 0.875rem;
			color: var(--alt-gray-500);
		}

		.post-card.featured .read-time {
			color: var(--alt-gray-400);
		}

		/* Newsletter */
		.newsletter {
			background: var(--alt-gray-50);
			padding: 4rem 2rem;
		}

		.newsletter-inner {
			max-width: 720px;
			margin: 0 auto;
			display: flex;
			flex-wrap: wrap;
			align-items: center;
			justify-content: space-between;
			gap: 2rem;
		}

		.newsletter-content h2 {
			font-family: var(--alt-font-display);
			font-size: 1.5rem;
			font-weight: 700;
			color: var(--alt-gray-900);
			margin: 0 0 0.5rem;
		}

		.newsletter-content p {
			font-size: 1rem;
			color: var(--alt-gray-600);
			margin: 0;
		}

		.newsletter-form {
			display: flex;
			gap: 0.75rem;
		}

		.newsletter-form input {
			padding: 0.75rem 1rem;
			font-size: 1rem;
			border: 1px solid var(--alt-gray-200);
			border-radius: var(--alt-radius-md);
			background: var(--alt-white);
			min-width: 250px;
		}

		.newsletter-form input:focus {
			outline: none;
			border-color: var(--alt-primary);
			box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
		}

		.btn {
			display: inline-flex;
			align-items: center;
			justify-content: center;
			padding: 0.75rem 1.5rem;
			font-size: 0.9375rem;
			font-weight: 600;
			border-radius: var(--alt-radius-md);
			transition: all var(--alt-transition-fast);
		}

		.btn-primary {
			background: var(--alt-gradient-primary);
			color: var(--alt-white);
		}

		.btn-primary:hover {
			transform: translateY(-1px);
			box-shadow: 0 4px 12px rgba(124, 58, 237, 0.3);
		}

		/* Responsive */
		@media (max-width: 768px) {
			.newsletter-inner {
				flex-direction: column;
				text-align: center;
			}

			.newsletter-form {
				flex-direction: column;
				width: 100%;
			}

			.newsletter-form input {
				min-width: 100%;
			}
		}

		@media (max-width: 640px) {
			.hero,
			.posts,
			.newsletter {
				padding: 4rem 1.25rem;
			}

			.post-card.featured {
				padding: 2rem;
			}
		}
	`
})
export class AltBlogPageComponent {}
