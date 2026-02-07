import { html, classMap, when } from '@melodicdev/core';
import type { DrawerComponent } from './drawer.component.js';

export function drawerTemplate(c: DrawerComponent) {
	return html`
		<dialog
			class=${classMap({
				'ml-drawer': true,
				[`ml-drawer--${c.side}`]: true,
				[`ml-drawer--${c.size}`]: true
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
								<ml-icon icon="x" size="sm"></ml-icon>
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
