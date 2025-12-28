import { html } from '../../../../src/template';
import type { AltFrameworkLayoutComponent } from './framework-layout.component';

export function frameworkLayoutTemplate(self: AltFrameworkLayoutComponent) {
	return html`
		<header class="header">
			<div class="header-inner">
				<a class="logo" :routerLink=${self.basePath + '/home'}>
					<img src="/img/melodic-development-icon.svg" alt="Melodic icon" />
					<span class="logo-text">Melodic Framework</span>
				</a>

				<nav class="nav">
					<a :routerLink=${self.basePath + '/docs'}>Docs</a>
					<a :routerLink=${self.basePath + '/tutorials'}>Tutorials</a>
					<a :routerLink=${self.basePath + '/download'}>Download</a>
					<a :routerLink=${self.basePath + '/roadmap'}>Roadmap</a>
					<a :routerLink=${self.basePath + '/community'}>Community</a>
					<a :routerLink=${self.basePath + '/blog'}>Blog</a>
				</nav>

				<div class="header-actions">
					<a href="https://github.com/melodicdev/melodic" class="btn btn-ghost">
						<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
							<path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
						</svg>
						GitHub
					</a>
					<a class="btn btn-primary" :routerLink=${self.basePath + '/docs'}>Get started</a>
					<a class="company-link" href="/home">Company site</a>
				</div>
			</div>
		</header>

		<main class="main">
			<router-outlet></router-outlet>
		</main>

		<footer class="footer">
			<div class="footer-inner">
				<div class="footer-brand">
					<a class="logo" :routerLink=${self.basePath + '/home'}>
						<img src="/img/melodic-development-icon.svg" alt="Melodic icon" />
						<span class="logo-text">Melodic</span>
					</a>
					<p class="footer-tagline">Lightweight web components for modern applications.</p>
				</div>

				<div class="footer-links">
					<div class="footer-col">
						<h4>Documentation</h4>
						<a :routerLink=${self.basePath + '/docs'}>Getting Started</a>
						<a :routerLink=${self.basePath + '/docs'}>Core Concepts</a>
						<a :routerLink=${self.basePath + '/docs'}>API Reference</a>
					</div>
					<div class="footer-col">
						<h4>Community</h4>
						<a :routerLink=${self.basePath + '/community'}>Contributing</a>
						<a href="https://github.com/melodicdev/melodic/discussions">Discussions</a>
						<a href="https://discord.gg/melodicdev">Discord</a>
					</div>
					<div class="footer-col">
						<h4>Company</h4>
						<a href="/home">Melodic Development</a>
						<a href="/services">Consulting</a>
						<a href="/contact">Contact</a>
					</div>
				</div>
			</div>

			<div class="footer-bottom">
				<div class="footer-bottom-inner">
					<p>&copy; 2025 Melodic Development. Built with Melodic Framework.</p>
				</div>
			</div>
		</footer>
	`;
}
