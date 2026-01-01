import { MelodicComponent } from '../../../../src/components';
import { Service } from '../../../../src/injection/decorators/service.decorator';
import { RouterService } from '../../../../src/routing';
import { html, css } from '../../../../src/template/functions/html.function';
import type { DashboardStats } from '../../../routing';

/**
 * Admin dashboard component - demonstrates using resolved data.
 * The dashboard stats are fetched by the resolver before this component renders.
 */
@MelodicComponent({
	selector: 'admin-dashboard',
	template: (self: AdminDashboardComponent) => html`
		<div class="dashboard">
			<h1>Dashboard</h1>
			<p class="subtitle">Welcome to the admin dashboard. Data loaded via resolver.</p>

			<div class="stats-grid">
				<div class="stat-card surface">
					<div class="stat-value">${self.stats?.totalUsers ?? '...'}</div>
					<div class="stat-label text-muted">Total Users</div>
				</div>
				<div class="stat-card surface">
					<div class="stat-value">${self.stats?.activeUsers ?? '...'}</div>
					<div class="stat-label text-muted">Active Users</div>
				</div>
				<div class="stat-card surface">
					<div class="stat-value">${self.stats?.newUsersToday ?? '...'}</div>
					<div class="stat-label text-muted">New Today</div>
				</div>
			</div>

			<div class="info-box surface">
				<h3>Resolved Data Demo</h3>
				<p class="text-muted">This data was fetched by the <code>dashboardStatsResolver</code> before navigation completed.</p>
				<pre>${JSON.stringify(self.stats, null, 2)}</pre>
			</div>
		</div>
	`,
	styles: () => css`
		.dashboard {
			max-width: 800px;
		}
		h1 {
			margin: 0 0 0.5rem 0;
			color: #2c3e50;
		}
		.subtitle {
			margin-bottom: 2rem;
		}
		.stats-grid {
			display: grid;
			grid-template-columns: repeat(3, 1fr);
			gap: 1rem;
			margin-bottom: 2rem;
		}
		.stat-card {
			padding: 1.5rem;
			text-align: center;
		}
		.stat-value {
			font-size: 2rem;
			font-weight: bold;
			color: #3498db;
		}
		.stat-label {
			font-size: 0.9rem;
			margin-top: 0.5rem;
		}
		.info-box {
			padding: 1rem;
		}
		.info-box h3 {
			margin: 0 0 0.5rem 0;
			color: #2c3e50;
		}
		.info-box p {
			margin-bottom: 1rem;
		}
		code {
			background: #ecf0f1;
			padding: 0.2rem 0.4rem;
			border-radius: 3px;
			font-family: monospace;
		}
		pre {
			background: #2c3e50;
			color: #ecf0f1;
			padding: 1rem;
			border-radius: 4px;
			overflow-x: auto;
			font-size: 0.85rem;
		}
	`
})
export class AdminDashboardComponent {
	@Service(RouterService) private router!: RouterService;

	stats: DashboardStats | null = null;

	onCreate(): void {
		// Get resolved data from the router service
		const resolvedData = this.router.getResolvedData();
		this.stats = resolvedData['stats'] as DashboardStats;

		console.log('[AdminDashboard] Resolved data:', resolvedData);
		console.log('[AdminDashboard] Route params:', this.router.getParams());
		console.log('[AdminDashboard] Route data:', this.router.getRouteData());
	}
}
