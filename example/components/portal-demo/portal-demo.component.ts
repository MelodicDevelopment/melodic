import { MelodicComponent } from '../../../src/components';
import type { OnInit } from '../../../src/components/interfaces/ilife-cycle-hooks.interface';
import { portalDemoTemplate } from './portal-demo.template';
import { portalDemoStyles } from './portal-demo.styles';
// Import to register the portal directive
import '../../../src/template/directives/builtin/portal.directive';

@MelodicComponent({
	selector: 'portal-demo',
	template: portalDemoTemplate,
	styles: portalDemoStyles
})
export class PortalDemoComponent implements OnInit {
	// Modal state
	showModal = false;

	// Tooltip state
	showTooltip = false;
	tooltipPosition = { x: 0, y: 0 };

	// Notification state
	notifications: Array<{ id: number; message: string; isNew: boolean }> = [];
	private notificationId = 0;

	onInit(): void {
		console.log('PortalDemoComponent initialized');
	}

	// Modal methods
	openModal = () => {
		this.showModal = true;
	};

	closeModal = () => {
		this.showModal = false;
	};

	handleOverlayClick = (e: Event) => {
		// Close if clicking the overlay, not the modal content
		if ((e.target as Element).classList.contains('modal-overlay')) {
			this.closeModal();
		}
	};

	// Tooltip methods
	handleMouseEnter = (e: MouseEvent) => {
		const rect = (e.target as Element).getBoundingClientRect();
		this.tooltipPosition = {
			x: rect.left + rect.width / 2,
			y: rect.top - 10
		};
		this.showTooltip = true;
	};

	handleMouseLeave = () => {
		this.showTooltip = false;
	};

	// Notification methods
	addNotification = () => {
		const id = ++this.notificationId;
		const messages = ['Action completed successfully!', 'Your changes have been saved.', 'New message received.', 'Update available.'];
		const message = messages[Math.floor(Math.random() * messages.length)];

		this.notifications = [...this.notifications, { id, message, isNew: true }];

		// Mark as not new after animation completes (300ms)
		setTimeout(() => {
			this.notifications = this.notifications.map((n) => (n.id === id ? { ...n, isNew: false } : n));
		}, 350);

		// Auto-remove after 3 seconds
		setTimeout(() => {
			this.removeNotification(id);
		}, 3000);
	};

	removeNotification = (id: number) => {
		this.notifications = this.notifications.filter((n) => n.id !== id);
	};
}
