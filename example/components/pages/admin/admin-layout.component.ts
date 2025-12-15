import { MelodicComponent } from '../../../../src/components';
import { html, css } from '../../../../src/template/functions/html.function';

/**
 * Admin layout component - contains nested router-outlet for admin child routes.
 * Demonstrates nested routing with a sidebar navigation.
 */
@MelodicComponent({
	selector: 'admin-layout',
	template: () => html`
		<div class="admin-layout">
			<aside class="sidebar">
				<h2>Admin Panel</h2>
				<nav class="admin-nav">
					<router-link href="/admin/dashboard" .exactMatch=${true}>Dashboard</router-link>
					<router-link href="/admin/users">Users</router-link>
				</nav>
			</aside>
			<main class="admin-content">
				<router-outlet></router-outlet>
			</main>
		</div>
	`,
	styles: () => css`
		.admin-layout {
			display: flex;
			min-height: 400px;
		}
		.sidebar {
			width: 200px;
			background: #2c3e50;
			color: white;
			padding: 1rem;
		}
		.sidebar h2 {
			margin: 0 0 1rem 0;
			font-size: 1.2rem;
			padding-bottom: 0.5rem;
			border-bottom: 1px solid rgba(255, 255, 255, 0.2);
		}
		.admin-nav {
			display: flex;
			flex-direction: column;
			gap: 0.5rem;
		}
		.admin-nav router-link {
			color: rgba(255, 255, 255, 0.8);
			text-decoration: none;
			padding: 0.5rem;
			border-radius: 4px;
			transition: all 0.2s;
		}
		.admin-nav router-link:hover {
			background: rgba(255, 255, 255, 0.1);
			color: white;
		}
		.admin-nav router-link.active {
			background: #3498db;
			color: white;
		}
		.admin-content {
			flex: 1;
			padding: 1rem;
			background: #f8f9fa;
		}
	`
})
export class AdminLayoutComponent {}
