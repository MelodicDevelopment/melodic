export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';
export type ModalHeaderLayout = 'inline' | 'stacked';
export type ModalHeaderAlign = 'left' | 'center';

export interface ModalConfig {
	/** Modal size variant */
	size?: ModalSize;
	/** Header layout - inline (icon beside title) or stacked (icon above title) */
	headerLayout?: ModalHeaderLayout;
	/** Header text alignment */
	headerAlign?: ModalHeaderAlign;
	/** Whether to show the close button */
	showClose?: boolean;
	/** Whether clicking the backdrop closes the modal */
	closeOnBackdrop?: boolean;
	/** Whether pressing Escape closes the modal */
	closeOnEscape?: boolean;
	/** Prevent modal from being closed (for loading states) */
	preventClose?: boolean;
}
