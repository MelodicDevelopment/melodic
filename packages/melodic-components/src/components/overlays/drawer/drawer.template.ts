import { html, classMap, when } from '@melodicdev/core';
import type { DrawerComponent } from './drawer.component.js';

export function drawerTemplate(c: DrawerComponent) {
	const side = c.side === 'left' ? 'left' : 'right';
	const size = c.size === 'sm' || c.size === 'md' || c.size === 'lg' || c.size === 'xl' ? c.size : 'md';

	return html`
		<dialog
			class=${classMap({
				'ml-drawer': true,
				'ml-drawer--left': side === 'left',
				'ml-drawer--right': side === 'right',
				'ml-drawer--sm': size === 'sm',
				'ml-drawer--md': size === 'md',
				'ml-drawer--lg': size === 'lg',
				'ml-drawer--xl': size === 'xl'
			})}
		>
			<div class="ml-drawer__panel">
				<div class="ml-drawer__header">
					<div class="ml-drawer__header-content">
						<slot name="drawer-header"></slot>
					</div>
					${when(
						c.showClose,
						() => html`
							<button class="ml-drawer__close" @click=${c.close} aria-label="Close">
								<ml-icon icon="x" size="sm" format="bold"></ml-icon>
							</button>
						`
					)}
				</div>
				<div class="ml-drawer__body">
					<slot></slot>
				</div>
				<div class="ml-drawer__footer">
					<slot name="drawer-footer"></slot>
				</div>
			</div>
		</dialog>
	`;
}
