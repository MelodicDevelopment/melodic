import { html } from '../../../../src/template';
import type { FrameworkLayoutComponent } from './framework-layout.component';

export function frameworkLayoutTemplate(self: FrameworkLayoutComponent) {
	return html`
		<div class="app">
			<header class="site-header">
				<div class="brand">
					<a class="logo" :routerLink=${self.basePath + '/home'} aria-label="Melodic Framework home">
						<img src="/img/melodic-development-icon.svg" alt="Melodic icon" />
						<span>Melodic Framework</span>
					</a>
					<p>Lightweight web components with a modern DX.</p>
				</div>
				<nav class="nav">
					<a :routerLink=${self.basePath + '/docs'}>Docs</a>
					<a :routerLink=${self.basePath + '/tutorials'}>Tutorials</a>
					<a :routerLink=${self.basePath + '/download'}>Download</a>
					<a :routerLink=${self.basePath + '/roadmap'}>Roadmap</a>
					<a :routerLink=${self.basePath + '/community'}>Community</a>
					<a :routerLink=${self.basePath + '/blog'}>Blog</a>
				</nav>
				<div class="actions">
					<a :routerLink=${self.basePath + '/docs'} class="button primary">Get started</a>
					<a :routerLink="/home" class="button ghost">Company site</a>
				</div>
			</header>
			<main class="content">
				<router-outlet></router-outlet>
			</main>
			<footer class="site-footer">
				<div class="footer-inner">
					<div>
						<h4>Melodic Framework</h4>
						<p>Composable web components and utilities for teams who care about speed.</p>
						<div class="footer-social">
							<a href="https://github.com/MelodicDevelopment/melodic" target="_blank" rel="noreferrer">GitHub</a>
							<a :routerLink=${self.basePath + '/docs'}>Docs</a>
						</div>
					</div>
					<div>
						<h5>Docs</h5>
						<ul>
							<li>Getting started</li>
							<li>Core concepts</li>
							<li>API reference</li>
						</ul>
					</div>
					<div>
						<h5>Community</h5>
						<ul>
							<li>Release notes</li>
							<li>Contributing</li>
							<li>Examples</li>
						</ul>
					</div>
					<div>
						<h5>Company</h5>
						<ul>
							<li>Melodic Development</li>
							<li>Consulting services</li>
							<li>Contact</li>
						</ul>
					</div>
				</div>
				<p class="footer-note">&copy; 2025 Melodic Development. Built with Melodic Framework.</p>
			</footer>
		</div>
	`;
}
