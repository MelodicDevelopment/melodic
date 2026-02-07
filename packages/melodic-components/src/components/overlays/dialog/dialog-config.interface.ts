export interface IDialogConfig<T> {
	data?: T;
	disableClose?: boolean;
	panelClass?: string | string[];
	size?: 'sm' | 'md' | 'lg' | 'xl' | 'full' | 'auto' | 'custom';
	width?: string;
}
