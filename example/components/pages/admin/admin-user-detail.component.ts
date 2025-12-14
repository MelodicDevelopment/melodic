import { MelodicComponent } from '../../../../src/components/melodic-component.decorator';
import { Service } from '../../../../src/injection/decorators/service.decorator';
import { RouterService } from '../../../../src/routing';
import { html, css } from '../../../../src/template/template-result.class';
import type { User } from '../../../routing';

/**
 * Admin user detail component - demonstrates route params and resolved data.
 * The user is fetched by the resolver based on the :userId route param.
 */
@MelodicComponent({
	selector: 'admin-user-detail',
	template: (self: AdminUserDetailComponent) => html`
		<div class="user-detail">
			<button class="back-btn" @click=${() => self.goBack()}>← Back to Users</button>

			<div class="user-header">
				<div class="user-avatar">${self.user?.name.charAt(0) ?? '?'}</div>
				<div>
					<h1>${self.user?.name ?? 'Loading...'}</h1>
					<p class="user-role">${self.user?.role ?? ''}</p>
				</div>
			</div>

			<div class="info-section">
				<h3>User Information</h3>
				<dl class="info-grid">
					<dt>ID</dt>
					<dd>${self.user?.id ?? '-'}</dd>
					<dt>Email</dt>
					<dd>${self.user?.email ?? '-'}</dd>
					<dt>Role</dt>
					<dd>${self.user?.role ?? '-'}</dd>
				</dl>
			</div>

			<div class="info-section">
				<h3>Route Information</h3>
				<p>This demonstrates accessing route params and resolved data via RouterService.</p>
				<dl class="info-grid">
					<dt>Route Param (userId)</dt>
					<dd><code>${self.userId}</code></dd>
					<dt>Route Data</dt>
					<dd><code>${JSON.stringify(self.routeData)}</code></dd>
				</dl>
			</div>
		</div>
	`,
	styles: () => css`
		.user-detail {
			max-width: 600px;
		}
		.back-btn {
			background: none;
			border: none;
			color: #3498db;
			cursor: pointer;
			padding: 0;
			margin-bottom: 1rem;
			font-size: 0.9rem;
		}
		.back-btn:hover {
			text-decoration: underline;
		}
		.user-header {
			display: flex;
			align-items: center;
			gap: 1rem;
			margin-bottom: 2rem;
		}
		.user-avatar {
			width: 80px;
			height: 80px;
			border-radius: 50%;
			background: #3498db;
			color: white;
			display: flex;
			align-items: center;
			justify-content: center;
			font-weight: bold;
			font-size: 2rem;
		}
		h1 {
			margin: 0;
			color: #2c3e50;
		}
		.user-role {
			color: #7f8c8d;
			margin: 0.25rem 0 0 0;
		}
		.info-section {
			background: white;
			padding: 1.5rem;
			border-radius: 8px;
			box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
			margin-bottom: 1rem;
		}
		.info-section h3 {
			margin: 0 0 1rem 0;
			color: #2c3e50;
			font-size: 1rem;
		}
		.info-section p {
			color: #7f8c8d;
			margin-bottom: 1rem;
			font-size: 0.9rem;
		}
		.info-grid {
			display: grid;
			grid-template-columns: 150px 1fr;
			gap: 0.5rem;
			margin: 0;
		}
		.info-grid dt {
			color: #7f8c8d;
			font-size: 0.9rem;
		}
		.info-grid dd {
			margin: 0;
			color: #2c3e50;
		}
		code {
			background: #ecf0f1;
			padding: 0.2rem 0.4rem;
			border-radius: 3px;
			font-family: monospace;
			font-size: 0.85rem;
		}
	`
})
export class AdminUserDetailComponent {
	@Service(RouterService) private router!: RouterService;

	user: User | null = null;
	userId: string = '';
	routeData: Record<string, unknown> = {};

	onCreate(): void {
		// Get route params via RouterService (NOT injected into component)
		this.userId = this.router.getParam('userId') ?? '';

		// Get resolved data via RouterService
		const resolvedData = this.router.getResolvedData();
		this.user = resolvedData['user'] as User;

		// Get static route data
		this.routeData = this.router.getRouteData();

		console.log('[AdminUserDetail] User ID from params:', this.userId);
		console.log('[AdminUserDetail] Resolved user:', this.user);
		console.log('[AdminUserDetail] Route data:', this.routeData);
	}

	goBack(): void {
		this.router.navigate('/admin/users');
	}
}
