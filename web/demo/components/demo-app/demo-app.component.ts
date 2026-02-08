import { MelodicComponent, Service } from '@melodicdev/core';
import type { IElementRef } from '@melodicdev/core';
import { DialogService, ToastService, type UniqueID, type ThemeMode, type SelectOption } from '@melodicdev/components';
import { applyTheme, getResolvedTheme, onThemeChange } from '@melodicdev/components/theme';
import { demoAppTemplate } from './demo-app.template';
import { demoAppStyles } from './demo-app.styles';
import { ConfirmDialog } from '../confirm-dialog/confirm-dialog.component';
import '../profile-popover/profile-popover.component';
import '../confirm-popover/confirm-popover.component';
import type { DialogComponentLoader } from 'packages/melodic-components/src/components/overlays/dialog/dialog-loader.type';

@MelodicComponent({
	selector: 'demo-app',
	template: demoAppTemplate,
	styles: demoAppStyles
})
export class DemoApp implements IElementRef {
	@Service(DialogService)
	private readonly _dialogService!: DialogService;

	@Service(ToastService)
	private readonly _toastService!: ToastService;

	public elementRef!: HTMLElement;

	public isDark = false;

	/** Sample options for select demos */
	public countryOptions: SelectOption[] = [
		{ value: 'us', label: 'United States', icon: 'flag', avatarUrl: 'https://i.pravatar.cc/48?img=32', avatarAlt: 'United States' },
		{ value: 'ca', label: 'Canada', icon: 'flag', avatarUrl: 'https://i.pravatar.cc/48?img=12', avatarAlt: 'Canada' },
		{ value: 'mx', label: 'Mexico', icon: 'flag', avatarUrl: 'https://i.pravatar.cc/48?img=15', avatarAlt: 'Mexico' },
		{ value: 'uk', label: 'United Kingdom', icon: 'flag', avatarUrl: 'https://i.pravatar.cc/48?img=24', avatarAlt: 'United Kingdom' },
		{ value: 'de', label: 'Germany', icon: 'flag', avatarUrl: 'https://i.pravatar.cc/48?img=18', avatarAlt: 'Germany' },
		{ value: 'fr', label: 'France', icon: 'flag', avatarUrl: 'https://i.pravatar.cc/48?img=28', avatarAlt: 'France' }
	];

	public statusOptions: SelectOption[] = [
		{ value: 'active', label: 'Active' },
		{ value: 'pending', label: 'Pending' },
		{ value: 'inactive', label: 'Inactive', disabled: true }
	];

	public multiSelectValues = ['us', 'ca'];

	constructor() {
		this.isDark = getResolvedTheme() === 'dark';
		onThemeChange((_: ThemeMode, resolved: 'light' | 'dark') => {
			this.isDark = resolved === 'dark';
		});
	}

	handleThemeToggle = (event: CustomEvent): void => {
		const { checked } = event.detail;
		applyTheme(checked ? 'dark' : 'light');
	};

	handleNavClick = (event: Event, targetId: string): void => {
		event.preventDefault();
		const root = this.elementRef?.shadowRoot;
		const target = root?.getElementById(targetId);
		if (!target) return;

		target.scrollIntoView({ behavior: 'smooth', block: 'start' });
		history.replaceState(null, '', `#${targetId}`);
	};

	handleMultiSelectChange = (event: CustomEvent): void => {
		const { values } = event.detail ?? {};
		if (Array.isArray(values)) {
			this.multiSelectValues = values;
		}
	};

	openDialog(dialogID: UniqueID | string): void {
		this._dialogService.open(dialogID as UniqueID);
	}

	closeDialog(dialogID: UniqueID | string): void {
		this._dialogService.close(dialogID as UniqueID);
	}

	handleConfirmResult = (event: CustomEvent): void => {
		console.log('Confirm popover result:', event.detail);
	};

	openConfirmDialog(): void {
		this._dialogService.open(ConfirmDialog as DialogComponentLoader, { data: { message: 'Are you sure you want to proceed?' }, size: 'sm' });
	}

	openDrawer = (id: string): void => {
		const root = this.elementRef?.shadowRoot;
		const drawer = root?.querySelector(`#${id}`) as HTMLElement & { component: { open(): void } } | null;
		drawer?.component.open();
	};

	showToast = (variant: string, title: string, message: string): void => {
		this._toastService.show({ variant: variant as 'info' | 'success' | 'warning' | 'error', title, message });
	};

	/** Pagination demo state */
	currentPage = 1;

	handlePageChange = (event: CustomEvent): void => {
		this.currentPage = event.detail.page;
	};
}

// Mount the app
const app = document.getElementById('app');
if (app) {
	app.innerHTML = '<demo-app></demo-app>';
}
