import { MelodicComponent, Service, html } from '@melodicdev/core';
import type { IElementRef } from '@melodicdev/core';
import { DialogService, ToastService, type UniqueID, type ThemeMode, type SelectOption } from '@melodicdev/components';
import type { TableColumn } from '@melodicdev/components/table';
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

	/** Slider error demo state */
	sliderError = 'Value must be at least 20';

	handleSliderValidation = (event: CustomEvent): void => {
		this.sliderError = event.detail.value < 20 ? 'Value must be at least 20' : '';
	};

	/** Date picker error demo state */
	datePickerError = 'Date is required';

	handleDatePickerChange = (event: CustomEvent): void => {
		this.datePickerError = event.detail.value ? '' : 'Date is required';
	};

	/** Table demo data */
	teamColumns: TableColumn[] = [
		{
			key: 'name', label: 'Name', sortable: true,
			render: (_, row) => html`
				<div style="display: flex; align-items: center; gap: 0.75rem;">
					<ml-avatar src=${row.avatar as string} size="sm"></ml-avatar>
					<div>
						<div style="font-weight: 500;">${row.name}</div>
						<div style="font-size: var(--ml-text-xs); color: var(--ml-color-text-muted);">${row.email}</div>
					</div>
				</div>
			`
		},
		{ key: 'role', label: 'Role', sortable: true },
		{
			key: 'status', label: 'Status',
			render: (val) => html`<ml-badge variant=${val === 'Active' ? 'success' : val === 'Pending' ? 'warning' : 'default'} size="sm">${val}</ml-badge>`
		},
		{ key: 'department', label: 'Department' },
		{
			key: 'actions', label: '', align: 'right', width: '80px',
			render: () => html`
				<ml-button variant="ghost" size="sm">
					<ml-icon icon="dots-three" size="sm"></ml-icon>
				</ml-button>
			`
		}
	];

	allTeamRows = [
		{ name: 'Olivia Rhye', email: 'olivia@example.com', avatar: 'https://i.pravatar.cc/48?img=5', role: 'Designer', status: 'Active', department: 'Design' },
		{ name: 'Phoenix Baker', email: 'phoenix@example.com', avatar: 'https://i.pravatar.cc/48?img=12', role: 'Developer', status: 'Active', department: 'Engineering' },
		{ name: 'Lana Steiner', email: 'lana@example.com', avatar: 'https://i.pravatar.cc/48?img=32', role: 'PM', status: 'Pending', department: 'Product' },
		{ name: 'Demi Wilkinson', email: 'demi@example.com', avatar: 'https://i.pravatar.cc/48?img=26', role: 'Designer', status: 'Active', department: 'Design' },
		{ name: 'Candice Wu', email: 'candice@example.com', avatar: 'https://i.pravatar.cc/48?img=44', role: 'Developer', status: 'Offline', department: 'Engineering' },
		{ name: 'Natali Craig', email: 'natali@example.com', avatar: 'https://i.pravatar.cc/48?img=47', role: 'Designer', status: 'Active', department: 'Design' },
		{ name: 'Drew Cano', email: 'drew@example.com', avatar: 'https://i.pravatar.cc/48?img=53', role: 'Manager', status: 'Active', department: 'Engineering' },
		{ name: 'Orlando Diggs', email: 'orlando@example.com', avatar: 'https://i.pravatar.cc/48?img=57', role: 'Developer', status: 'Pending', department: 'Engineering' },
		{ name: 'Andi Lane', email: 'andi@example.com', avatar: 'https://i.pravatar.cc/48?img=36', role: 'Developer', status: 'Active', department: 'Engineering' },
		{ name: 'Kate Morrison', email: 'kate@example.com', avatar: 'https://i.pravatar.cc/48?img=23', role: 'PM', status: 'Active', department: 'Product' },
		{ name: 'Koray Okumus', email: 'koray@example.com', avatar: 'https://i.pravatar.cc/48?img=60', role: 'Designer', status: 'Offline', department: 'Design' },
		{ name: 'Emily Pham', email: 'emily@example.com', avatar: 'https://i.pravatar.cc/48?img=9', role: 'Developer', status: 'Active', department: 'Engineering' },
	];

	teamPageSize = 5;
	teamPage = 1;

	get teamTotalPages(): number {
		return Math.ceil(this.allTeamRows.length / this.teamPageSize);
	}

	get teamRows(): Record<string, unknown>[] {
		const start = (this.teamPage - 1) * this.teamPageSize;
		return this.allTeamRows.slice(start, start + this.teamPageSize);
	}

	simpleColumns: TableColumn[] = [
		{ key: 'invoice', label: 'Invoice', sortable: true },
		{ key: 'date', label: 'Date', sortable: true },
		{ key: 'amount', label: 'Amount', align: 'right', sortable: true },
		{
			key: 'status', label: 'Status',
			render: (val) => html`<ml-badge variant=${val === 'Paid' ? 'success' : val === 'Pending' ? 'warning' : 'error'} size="sm" pill>${val}</ml-badge>`
		}
	];

	invoiceRows = [
		{ invoice: 'INV-001', date: 'Jan 15, 2026', amount: '$1,250.00', status: 'Paid' },
		{ invoice: 'INV-002', date: 'Jan 20, 2026', amount: '$3,600.00', status: 'Pending' },
		{ invoice: 'INV-003', date: 'Feb 01, 2026', amount: '$890.00', status: 'Paid' },
		{ invoice: 'INV-004', date: 'Feb 05, 2026', amount: '$2,100.00', status: 'Overdue' },
		{ invoice: 'INV-005', date: 'Feb 08, 2026', amount: '$4,500.00', status: 'Paid' },
	];

	handleTeamPageChange = (event: CustomEvent): void => {
		this.teamPage = event.detail.page;
	};

	handleTableSort = (event: CustomEvent): void => {
		console.log('Sort:', event.detail);
	};

	handleTableSelect = (event: CustomEvent): void => {
		console.log('Selected:', event.detail);
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
