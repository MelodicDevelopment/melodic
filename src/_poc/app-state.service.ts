// /**
//  * Example Shared State Service using Signals
//  * This demonstrates how signals can be used for cross-component state management
//  */

// import { signal, computed } from './signal.class';

// export class AppStateService {
// 	// Shared signals accessible across all components
// 	theme = signal<'light' | 'dark'>('light');
// 	user = signal<{ name: string; email: string } | null>(null);
// 	notifications = signal<Array<{ id: number; message: string; read: boolean }>>([]);

// 	// Computed signals
// 	isDarkMode = computed(() => this.theme.value === 'dark');
// 	isLoggedIn = computed(() => this.user.value !== null);
// 	unreadCount = computed(() => this.notifications.value.filter((n) => !n.read).length);
// 	hasUnread = computed(() => this.unreadCount.value > 0);

// 	// Theme actions
// 	toggleTheme = () => {
// 		this.theme.value = this.theme.value === 'light' ? 'dark' : 'light';
// 	};

// 	setTheme = (theme: 'light' | 'dark') => {
// 		this.theme.value = theme;
// 	};

// 	// User actions
// 	login = (name: string, email: string) => {
// 		this.user.value = { name, email };
// 	};

// 	logout = () => {
// 		this.user.value = null;
// 	};

// 	// Notification actions
// 	addNotification = (message: string) => {
// 		this.notifications.update((current) => [
// 			...current,
// 			{
// 				id: Date.now(),
// 				message,
// 				read: false
// 			}
// 		]);
// 	};

// 	markAsRead = (id: number) => {
// 		this.notifications.update((current) => current.map((n) => (n.id === id ? { ...n, read: true } : n)));
// 	};

// 	markAllAsRead = () => {
// 		this.notifications.update((current) => current.map((n) => ({ ...n, read: true })));
// 	};

// 	clearNotifications = () => {
// 		this.notifications.value = [];
// 	};
// }
