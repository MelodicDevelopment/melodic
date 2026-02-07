import { html } from '@melodicdev/core';
import type { ProfilePopover } from './profile-popover.component';

export const profilePopoverTemplate = (c: ProfilePopover) => html`
	<ml-popover placement="bottom-start" arrow>
		<ml-button slot="trigger" variant="ghost" class="profile-trigger">
			<ml-avatar size="xs" .initials=${c.name.slice(0, 2).toUpperCase()} .src=${c.avatarUrl}></ml-avatar>
			<span class="profile-trigger__name">${c.name}</span>
		</ml-button>

		<div class="profile-card">
			<div class="profile-card__header">
				<ml-avatar size="lg" .initials=${c.name.slice(0, 2).toUpperCase()} .src=${c.avatarUrl}></ml-avatar>
				<div class="profile-card__info">
					<span class="profile-card__name">${c.name}</span>
					<span class="profile-card__email">${c.email}</span>
				</div>
				<ml-badge variant="primary" pill>${c.role}</ml-badge>
			</div>

			<ml-divider></ml-divider>

			<nav class="profile-card__actions">
				<a href="#" class="profile-card__action" @click=${(e: Event) => e.preventDefault()}>
					<ml-icon icon="user" size="sm"></ml-icon>
					View Profile
				</a>
				<a href="#" class="profile-card__action" @click=${(e: Event) => e.preventDefault()}>
					<ml-icon icon="gear" size="sm"></ml-icon>
					Settings
				</a>
				<a href="#" class="profile-card__action profile-card__action--danger" @click=${(e: Event) => e.preventDefault()}>
					<ml-icon icon="sign-out" size="sm"></ml-icon>
					Sign Out
				</a>
			</nav>
		</div>
	</ml-popover>
`;
