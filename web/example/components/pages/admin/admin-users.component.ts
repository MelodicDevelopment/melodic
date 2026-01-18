import { MelodicComponent } from '../../../../../src/components';
import { Service } from '../../../../../src/injection/decorators/service.decorator';
import { RouterService } from '../../../../../src/routing';
import { repeat } from '../../../../../src/template/directives/builtin/repeat.directive';
import { html, css } from '../../../../../src/template/functions/html.function';
import type { User } from '../../../routing';

/**
 * Admin users list component - demonstrates resolved data and navigation.
 */
@MelodicComponent({
	selector: 'admin-users',
	template: (self: AdminUsersComponent) => html`
		<div class="users-page">
			<h1>Users</h1>
			<p class="subtitle">User list loaded via resolver. Click a user to see details.</p>

			<div class="users-list">
				${repeat(
					self.users,
					(user) => user.id,
					(user) => html`
						<div class="user-card surface" @click=${() => self.viewUser(user.id)}>
							<div class="user-avatar">${user.name.charAt(0)}</div>
							<div class="user-info">
								<div class="user-name">${user.name}</div>
								<div class="user-email text-muted">${user.email}</div>
							</div>
							<div class="user-role text-muted">${user.role}</div>
						</div>
					`
				)}
			</div>
		</div>
	`,
	styles: () => css`
		.users-page {
			max-width: 600px;
		}
		h1 {
			margin: 0 0 0.5rem 0;
			color: #2c3e50;
		}
		.subtitle {
			margin-bottom: 1.5rem;
		}
		.users-list {
			display: flex;
			flex-direction: column;
			gap: 0.5rem;
		}
		.user-card {
			display: flex;
			align-items: center;
			gap: 1rem;
			padding: 1rem;
			cursor: pointer;
			transition: all 0.2s;
		}
		.user-card:hover {
			transform: translateX(4px);
			box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
		}
		.user-avatar {
			width: 40px;
			height: 40px;
			border-radius: 50%;
			background: #3498db;
			color: white;
			display: flex;
			align-items: center;
			justify-content: center;
			font-weight: bold;
			font-size: 1.2rem;
		}
		.user-info {
			flex: 1;
		}
		.user-name {
			font-weight: 500;
			color: #2c3e50;
		}
		.user-email {
			font-size: 0.85rem;
		}
		.user-role {
			background: #ecf0f1;
			padding: 0.25rem 0.75rem;
			border-radius: 12px;
			font-size: 0.8rem;
		}
	`
})
export class AdminUsersComponent {
	@Service(RouterService) private readonly _router!: RouterService;

	users: User[] = [];

	onCreate(): void {
		// Get resolved data from the router service
		const resolvedData = this._router.getResolvedData();
		this.users = (resolvedData['users'] as User[]) ?? [];

		console.log('[AdminUsers] Resolved users:', this.users);
	}

	viewUser(userId: string): void {
		// Navigate to user detail page
		this._router.navigate(`/admin/users/${userId}`);
	}
}
