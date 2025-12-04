/**
 * Template for Theme Toggle Component
 * Shows how to access shared state signals from a service
 */

import { html } from '../../template/template';
import type { ThemeToggleComponent } from './theme-toggle.component';

export function themeToggleTemplate(component: ThemeToggleComponent) {
	const { appState } = component;

	return html`
		<div
			style="
			padding: 20px;
			font-family: sans-serif;
			background: ${appState.isDarkMode.value ? '#333' : '#fff'};
			color: ${appState.isDarkMode.value ? '#fff' : '#333'};
			border-radius: 8px;
			transition: all 0.3s;
		"
		>
			<h2>Shared State Demo</h2>

			<!-- Theme Section -->
			<div style="margin: 20px 0; padding: 15px; background: ${appState.isDarkMode.value ? '#444' : '#f0f0f0'}; border-radius: 4px;">
				<h3>Theme</h3>
				<p><strong>Current Theme:</strong> ${appState.theme.value}</p>
				<p><strong>Is Dark Mode:</strong> ${appState.isDarkMode.value ? '✓ Yes' : '✗ No'}</p>
				<button @click=${component.toggleTheme} style="padding: 8px 16px; cursor: pointer;">Toggle Theme</button>
			</div>

			<!-- User Section -->
			<div style="margin: 20px 0; padding: 15px; background: ${appState.isDarkMode.value ? '#444' : '#f0f0f0'}; border-radius: 4px;">
				<h3>User</h3>
				<p><strong>Is Logged In:</strong> ${appState.isLoggedIn.value ? '✓ Yes' : '✗ No'}</p>
				${appState.user.value
					? html` <p><strong>Name:</strong> ${appState.user.value.name}</p>
							<p><strong>Email:</strong> ${appState.user.value.email}</p>
							<button @click=${component.logout} style="padding: 8px 16px; cursor: pointer;">Logout</button>`
					: html` <button @click=${component.login} style="padding: 8px 16px; cursor: pointer;">Login</button> `}
			</div>

			<!-- Notifications Section -->
			<div style="margin: 20px 0; padding: 15px; background: ${appState.isDarkMode.value ? '#444' : '#f0f0f0'}; border-radius: 4px;">
				<h3>Notifications</h3>
				<p><strong>Total:</strong> ${appState.notifications.value.length}</p>
				<p><strong>Unread:</strong> ${appState.unreadCount.value}</p>
				<p><strong>Has Unread:</strong> ${appState.hasUnread.value ? '✓ Yes' : '✗ No'}</p>

				<div style="display: flex; gap: 10px; margin: 10px 0;">
					<button @click=${component.addNotification} style="padding: 8px 16px; cursor: pointer;">Add Notification</button>
					<button @click=${() => appState.markAllAsRead()} style="padding: 8px 16px; cursor: pointer;" ?disabled=${!appState.hasUnread.value}>
						Mark All Read
					</button>
					<button @click=${() => appState.clearNotifications()} style="padding: 8px 16px; cursor: pointer;">Clear All</button>
				</div>

				${appState.notifications.value.length > 0
					? html`
							<ul style="margin-top: 15px; padding-left: 20px;">
								${appState.notifications.value.map(
									(notif) => html`
										<li
											style="
											margin: 5px 0;
											opacity: ${notif.read ? 0.5 : 1};
											text-decoration: ${notif.read ? 'line-through' : 'none'};
										"
										>
											${notif.message}
											${!notif.read
												? html` <button
														@click=${() => appState.markAsRead(notif.id)}
														style="margin-left: 10px; padding: 2px 8px; cursor: pointer;"
												  >
														Mark Read
												  </button>`
												: ''}
										</li>
									`
								)}
							</ul>
					  `
					: html` <p style="font-style: italic; margin-top: 15px;">No notifications</p> `}
			</div>

			<div style="margin-top: 30px; padding: 15px; background: ${appState.isDarkMode.value ? '#555' : '#e8f4f8'}; border-left: 4px solid #0088cc;">
				<strong>Key Point:</strong> Any component can inject AppStateService and access these same signals. When one component updates a signal, ALL
				components subscribed to it automatically re-render!
			</div>
		</div>
	`;
}
