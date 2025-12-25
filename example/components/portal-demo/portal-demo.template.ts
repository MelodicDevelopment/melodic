import { html, repeat, classMap } from '../../../src/template';
import type { PortalDemoComponent } from './portal-demo.component';

export function portalDemoTemplate(component: PortalDemoComponent) {
	return html`
		<div class="portal-demo">
			<h2>Portal Demo</h2>
			<p class="description">Demonstrating the :portal directive for rendering content outside the component's DOM hierarchy.</p>

			<!-- Modal Example -->
			<section class="demo-section">
				<h3>Modal (Portal to body)</h3>
				<p>The modal is rendered at document.body level, escaping any overflow or z-index constraints.</p>
				<button @click=${component.openModal}>Open Modal</button>

				<div class=${`modal-overlay ${component.showModal ? 'visible' : ''}`} :portal="body" @click=${component.handleOverlayClick}>
					<div class="modal" @click=${(e: Event) => e.stopPropagation()}>
						<header>
							<h4>Modal Title</h4>
							<button class="close-btn" @click=${component.closeModal}>&times;</button>
						</header>
						<main>
							<p>This modal is rendered using the :portal directive.</p>
							<p>It's teleported to document.body, so it won't be affected by parent overflow or z-index.</p>
						</main>
						<footer>
							<button @click=${component.closeModal}>Close</button>
						</footer>
					</div>
				</div>
			</section>

			<!-- Tooltip Example -->
			<section class="demo-section">
				<h3>Tooltip (Portal to body)</h3>
				<p>Hover over the button to see a tooltip that renders at body level.</p>
				<button class="tooltip-trigger" @mouseenter=${component.handleMouseEnter} @mouseleave=${component.handleMouseLeave}>
					Hover for Tooltip
				</button>

				<div
					class=${`tooltip ${component.showTooltip ? 'visible' : ''}`}
					:portal="body"
					style=${`left: ${component.tooltipPosition.x}px; top: ${component.tooltipPosition.y}px;`}
				>
					This is a portaled tooltip!
				</div>
			</section>

			<!-- Notifications Example -->
			<section class="demo-section">
				<h3>Notifications (Portal to body)</h3>
				<p>Notifications container is portaled to body, notifications render inside it normally.</p>
				<button @click=${component.addNotification}>Add Notification</button>

				<!-- Portal the container, not individual items -->
				<div class="notification-container" :portal="body">
					${repeat(
						component.notifications,
						(n) => n.id,
						(notification) => html`
							<div class=${classMap({ notification: true, 'notification--animating': notification.isNew })}>
								<span>${notification.message}</span>
								<button class="dismiss" @click=${() => component.removeNotification(notification.id)}>&times;</button>
							</div>
						`
					)}
				</div>
			</section>

			<!-- Info Box -->
			<section class="info-box">
				<h4>How it works</h4>
				<ul>
					<li><code>:portal="body"</code> - Teleports to document.body</li>
					<li><code>:portal="#container"</code> - Teleports to element with ID "container"</li>
					<li><code>:portal=\${element}</code> - Teleports to a direct element reference</li>
					<li><code>:portal=\${{ target: 'body', persist: true }}</code> - Content persists after component unmounts</li>
				</ul>
				<h4>Best Practices</h4>
				<ul>
					<li>When using <code>repeat()</code>, portal the container, not individual items</li>
					<li>Use CSS classes for visibility instead of <code>when()</code> with portals</li>
				</ul>
			</section>
		</div>
	`;
}
