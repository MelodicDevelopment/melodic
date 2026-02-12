export type ToastVariant = 'info' | 'success' | 'warning' | 'error';

export type ToastPosition = 'top-right' | 'top-left' | 'top-center' | 'bottom-right' | 'bottom-left' | 'bottom-center';

export interface IToastConfig {
	/** Toast variant */
	variant?: ToastVariant;

	/** Toast title */
	title?: string;

	/** Toast message body */
	message?: string;

	/** Auto-dismiss duration in ms (0 = no auto-dismiss, default: 5000) */
	duration?: number;

	/** Show dismiss button (default: true) */
	dismissible?: boolean;
}
