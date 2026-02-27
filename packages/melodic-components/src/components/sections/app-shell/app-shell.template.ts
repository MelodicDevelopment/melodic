import { html, classMap, when } from '@melodicdev/core';
import type { AppShellComponent } from './app-shell.component.js';

export function appShellTemplate(c: AppShellComponent) {
	const sidebarRight = c['sidebar-position'] === 'right';
	const collapsed = c['sidebar-collapsed'];
	const headerFixed = c['header-fixed'];
	const mobileOpen = c.mobileOpen;
	const isMobile = c.mobile;

	return html`
		<div
			class=${classMap({
				'ml-app-shell': true,
				'ml-app-shell--sidebar-right': sidebarRight,
				'ml-app-shell--sidebar-collapsed': collapsed,
				'ml-app-shell--header-fixed': headerFixed,
				'ml-app-shell--mobile-open': mobileOpen
			})}
		>
			${when(isMobile, () => html`
				<div
					class=${classMap({
						'ml-app-shell__backdrop': true,
						'ml-app-shell__backdrop--visible': mobileOpen
					})}
					@click=${c.closeMobileSidebar}
				></div>
			`)}

			<aside
				class=${classMap({
					'ml-app-shell__sidebar': true,
					'ml-app-shell__sidebar--mobile-open': mobileOpen
				})}
			>
				<slot name="sidebar"></slot>
			</aside>

			<div class="ml-app-shell__main">
				<header class="ml-app-shell__header">
					${when(isMobile, () => html`
						<button
							class="ml-app-shell__menu-btn"
							type="button"
							aria-label="Toggle navigation"
							@click=${c.toggleMobileSidebar}
						>
							<svg width="20" height="20" viewBox="0 0 20 20" fill="none">
								<path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
							</svg>
						</button>
					`)}
					<slot name="header"></slot>
				</header>

				<div class="ml-app-shell__content">
					<slot></slot>
				</div>
			</div>
		</div>
	`;
}
