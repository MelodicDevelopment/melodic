import { MelodicComponent, Service, html } from '@melodicdev/core';
import type { IElementRef } from '@melodicdev/core';
import { DialogService, ToastService, type UniqueID, type ThemeMode, type SelectOption } from '@melodicdev/components';
import type { TableColumn } from '@melodicdev/components/table';
import type { DataGridColumn } from '@melodicdev/components/data-grid';
import type { StepConfig } from '@melodicdev/components/steps';
import type { CalendarEvent } from '@melodicdev/components/calendar-view';
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
		const drawer = root?.querySelector(`#${id}`) as (HTMLElement & { component: { open(): void } }) | null;
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
			key: 'name',
			label: 'Name',
			sortable: true,
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
			key: 'status',
			label: 'Status',
			render: (val) => html`<ml-badge variant=${val === 'Active' ? 'success' : val === 'Pending' ? 'warning' : 'default'} size="sm">${val}</ml-badge>`
		},
		{ key: 'department', label: 'Department' },
		{
			key: 'actions',
			label: '',
			align: 'right',
			width: '80px',
			render: () => html`
				<ml-button variant="ghost" size="sm">
					<ml-icon icon="dots-three" size="sm"></ml-icon>
				</ml-button>
			`
		}
	];

	allTeamRows = [
		{
			name: 'Olivia Rhye',
			email: 'olivia@example.com',
			avatar: 'https://i.pravatar.cc/48?img=5',
			role: 'Designer',
			status: 'Active',
			department: 'Design'
		},
		{
			name: 'Phoenix Baker',
			email: 'phoenix@example.com',
			avatar: 'https://i.pravatar.cc/48?img=12',
			role: 'Developer',
			status: 'Active',
			department: 'Engineering'
		},
		{ name: 'Lana Steiner', email: 'lana@example.com', avatar: 'https://i.pravatar.cc/48?img=32', role: 'PM', status: 'Pending', department: 'Product' },
		{
			name: 'Demi Wilkinson',
			email: 'demi@example.com',
			avatar: 'https://i.pravatar.cc/48?img=26',
			role: 'Designer',
			status: 'Active',
			department: 'Design'
		},
		{
			name: 'Candice Wu',
			email: 'candice@example.com',
			avatar: 'https://i.pravatar.cc/48?img=44',
			role: 'Developer',
			status: 'Offline',
			department: 'Engineering'
		},
		{
			name: 'Natali Craig',
			email: 'natali@example.com',
			avatar: 'https://i.pravatar.cc/48?img=47',
			role: 'Designer',
			status: 'Active',
			department: 'Design'
		},
		{
			name: 'Drew Cano',
			email: 'drew@example.com',
			avatar: 'https://i.pravatar.cc/48?img=53',
			role: 'Manager',
			status: 'Active',
			department: 'Engineering'
		},
		{
			name: 'Orlando Diggs',
			email: 'orlando@example.com',
			avatar: 'https://i.pravatar.cc/48?img=57',
			role: 'Developer',
			status: 'Pending',
			department: 'Engineering'
		},
		{
			name: 'Andi Lane',
			email: 'andi@example.com',
			avatar: 'https://i.pravatar.cc/48?img=36',
			role: 'Developer',
			status: 'Active',
			department: 'Engineering'
		},
		{ name: 'Kate Morrison', email: 'kate@example.com', avatar: 'https://i.pravatar.cc/48?img=23', role: 'PM', status: 'Active', department: 'Product' },
		{
			name: 'Koray Okumus',
			email: 'koray@example.com',
			avatar: 'https://i.pravatar.cc/48?img=60',
			role: 'Designer',
			status: 'Offline',
			department: 'Design'
		},
		{
			name: 'Emily Pham',
			email: 'emily@example.com',
			avatar: 'https://i.pravatar.cc/48?img=9',
			role: 'Developer',
			status: 'Active',
			department: 'Engineering'
		}
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
			key: 'status',
			label: 'Status',
			render: (val) => html`<ml-badge variant=${val === 'Paid' ? 'success' : val === 'Pending' ? 'warning' : 'error'} size="sm" pill>${val}</ml-badge>`
		}
	];

	invoiceRows = [
		{ invoice: 'INV-001', date: 'Jan 15, 2026', amount: '$1,250.00', status: 'Paid' },
		{ invoice: 'INV-002', date: 'Jan 20, 2026', amount: '$3,600.00', status: 'Pending' },
		{ invoice: 'INV-003', date: 'Feb 01, 2026', amount: '$890.00', status: 'Paid' },
		{ invoice: 'INV-004', date: 'Feb 05, 2026', amount: '$2,100.00', status: 'Overdue' },
		{ invoice: 'INV-005', date: 'Feb 08, 2026', amount: '$4,500.00', status: 'Paid' }
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

	/** Virtual table demo data — 1 000 generated rows */
	virtualTableColumns: TableColumn[] = [
		{ key: 'id', label: '#', width: '60px', sortable: true },
		{ key: 'name', label: 'Name', sortable: true },
		{ key: 'email', label: 'Email', sortable: true },
		{ key: 'department', label: 'Department', sortable: true },
		{
			key: 'status',
			label: 'Status',
			render: (val) => html`<ml-badge variant=${val === 'Active' ? 'success' : val === 'Inactive' ? 'default' : 'warning'} size="sm" pill>${val}</ml-badge>`
		},
		{
			key: 'salary',
			label: 'Salary',
			align: 'right' as const,
			sortable: true,
			render: (val) => html`$${(val as number).toLocaleString()}`
		}
	];

	virtualTableRows = (() => {
		const depts = ['Engineering', 'Design', 'Product', 'Marketing', 'Sales', 'Finance', 'HR', 'Operations'];
		const statuses = ['Active', 'Inactive', 'Pending'];
		const firstNames = ['Alex', 'Blake', 'Cameron', 'Dana', 'Eden', 'Finley', 'Gray', 'Harper', 'Indigo', 'Jordan'];
		const lastNames = ['Anderson', 'Brown', 'Chen', 'Davis', 'Evans', 'Foster', 'Garcia', 'Harris', 'Ivanov', 'Johnson'];
		return Array.from({ length: 1000 }, (_, i) => {
			const first = firstNames[i % firstNames.length];
			const last = lastNames[Math.floor(i / firstNames.length) % lastNames.length];
			const name = `${first} ${last}`;
			return {
				id: i + 1,
				name,
				email: `${first.toLowerCase()}.${last.toLowerCase()}${i > 99 ? i : ''}@example.com`,
				department: depts[i % depts.length],
				status: statuses[i % statuses.length],
				salary: 50000 + (i % 10) * 5000 + (i % 3) * 2500
			};
		});
	})();

	/** Pagination demo state */
	currentPage = 1;

	handlePageChange = (event: CustomEvent): void => {
		this.currentPage = event.detail.page;
	};

	/** Steps demo data */
	wizardSteps: StepConfig[] = [
		{ value: 'details', label: 'Your details', description: 'Name and email address' },
		{ value: 'company', label: 'Company details', description: 'A few details about your company' },
		{ value: 'invite', label: 'Invite your team', description: 'Start collaborating with your team' },
		{ value: 'review', label: 'Review', description: 'Review and confirm' }
	];

	iconSteps: StepConfig[] = [
		{ value: 'details', label: 'Your details', description: 'Name and email address', icon: 'user' },
		{ value: 'company', label: 'Company details', description: 'A few details about your company', icon: 'buildings' },
		{ value: 'invite', label: 'Invite your team', description: 'Start collaborating with your team', icon: 'users' },
		{ value: 'review', label: 'Review', description: 'Review and confirm', icon: 'check-circle' }
	];

	activeStep = 'company';

	handleStepChange = (event: CustomEvent): void => {
		this.activeStep = event.detail.value;
	};

	goToStep = (value: string): void => {
		this.activeStep = value;
	};

	/** Calendar view demo data */
	calendarView = 'month';
	calendarEvents: CalendarEvent[] = [
		{ id: '1', title: 'Team standup', start: '2026-02-09T09:00:00', end: '2026-02-09T09:30:00', color: 'blue' },
		{ id: '2', title: 'Sprint planning', start: '2026-02-09T10:00:00', end: '2026-02-09T11:30:00', color: 'purple' },
		{ id: '3', title: 'Design review', start: '2026-02-10T09:00:00', end: '2026-02-10T10:00:00', color: 'purple' },
		{ id: '4', title: 'Lunch with client', start: '2026-02-10T12:00:00', end: '2026-02-10T13:00:00', color: 'green' },
		{ id: '5', title: '1:1 with manager', start: '2026-02-10T14:00:00', end: '2026-02-10T14:30:00', color: 'blue' },
		{ id: '6', title: 'Product demo', start: '2026-02-10T15:00:00', end: '2026-02-10T16:00:00', color: 'orange' },
		{ id: '7', title: 'Team standup', start: '2026-02-11T09:00:00', end: '2026-02-11T09:30:00', color: 'blue' },
		{ id: '8', title: 'Code review', start: '2026-02-11T11:00:00', end: '2026-02-11T12:00:00', color: 'gray' },
		{ id: '9', title: 'QA sync', start: '2026-02-11T14:00:00', end: '2026-02-11T14:45:00', color: 'pink' },
		{ id: '10', title: 'Team standup', start: '2026-02-12T09:00:00', end: '2026-02-12T09:30:00', color: 'blue' },
		{ id: '11', title: 'Architecture discussion', start: '2026-02-12T10:00:00', end: '2026-02-12T11:30:00', color: 'purple' },
		{ id: '12', title: 'Yoga break', start: '2026-02-12T12:30:00', end: '2026-02-12T13:00:00', color: 'green' },
		{ id: '13', title: 'Team standup', start: '2026-02-13T09:00:00', end: '2026-02-13T09:30:00', color: 'blue' },
		{ id: '14', title: 'Sprint retrospective', start: '2026-02-13T15:00:00', end: '2026-02-13T16:00:00', color: 'yellow' },
		{ id: '15', title: 'All hands meeting', start: '2026-02-14T10:00:00', end: '2026-02-14T11:00:00', color: 'purple', allDay: false },
		{ id: '16', title: "Valentine's day lunch", start: '2026-02-14T12:00:00', end: '2026-02-14T13:30:00', color: 'pink' },
		{ id: '17', title: 'Release planning', start: '2026-02-16T09:30:00', end: '2026-02-16T10:30:00', color: 'orange' },
		{ id: '18', title: 'Team standup', start: '2026-02-16T09:00:00', end: '2026-02-16T09:30:00', color: 'blue' },
		{ id: '19', title: 'UX workshop', start: '2026-02-17T13:00:00', end: '2026-02-17T15:00:00', color: 'purple' },
		{ id: '20', title: 'Budget review', start: '2026-02-18T10:00:00', end: '2026-02-18T11:00:00', color: 'gray' },
		{ id: '21', title: 'Team standup', start: '2026-02-18T09:00:00', end: '2026-02-18T09:30:00', color: 'blue' },
		{ id: '22', title: 'Interview candidate', start: '2026-02-19T11:00:00', end: '2026-02-19T12:00:00', color: 'green' },
		{ id: '23', title: 'Hackathon kickoff', start: '2026-02-20T09:00:00', end: '2026-02-20T10:00:00', color: 'orange' },
		{ id: '24', title: 'Demo day', start: '2026-02-20T16:00:00', end: '2026-02-20T17:00:00', color: 'yellow' },
		{ id: '25', title: 'Team lunch', start: '2026-02-21T12:00:00', end: '2026-02-21T13:00:00', color: 'green' },
		{ id: '26', title: 'Board presentation', start: '2026-02-24T10:00:00', end: '2026-02-24T12:00:00', color: 'purple' },
		{ id: '27', title: 'Security audit', start: '2026-02-25T09:00:00', end: '2026-02-25T11:00:00', color: 'pink' },
		{ id: '28', title: 'Offsite planning', start: '2026-02-26T14:00:00', end: '2026-02-26T15:30:00', color: 'orange' }
	];

	handleCalendarViewChange = (event: CustomEvent): void => {
		this.calendarView = event.detail.view;
	};

	handleCalendarEventClick = (event: CustomEvent): void => {
		console.log('Calendar event clicked:', event.detail.event);
	};

	handleCalendarDateClick = (event: CustomEvent): void => {
		console.log('Calendar date clicked:', event.detail.date);
	};

	handleCalendarAddEvent = (event: CustomEvent): void => {
		console.log('Calendar add event:', event.detail.date ?? 'no date');
	};

	/** Data grid demo data */
	gridColumns: DataGridColumn[] = [
		{ key: 'id', label: 'ID', width: 80, pinned: 'left', sortable: true, filterable: true },
		{ key: 'name', label: 'Name', width: 180, pinned: 'left', sortable: true, filterable: true },
		{ key: 'email', label: 'Email', width: 220, sortable: true, filterable: true },
		{ key: 'department', label: 'Department', width: 160, sortable: true, filterable: true },
		{ key: 'role', label: 'Role', width: 160, sortable: true, filterable: true },
		{
			key: 'status',
			label: 'Status',
			width: 130,
			sortable: true,
			filterable: true,
			render: (val: unknown) =>
				html`<ml-badge variant=${val === 'Active' ? 'success' : val === 'Pending' ? 'warning' : 'default'} size="sm">${val}</ml-badge>`
		},
		{ key: 'salary', label: 'Salary', width: 130, align: 'right', sortable: true, render: (val: unknown) => `$${(val as number).toLocaleString()}` },
		{ key: 'joined', label: 'Joined', width: 140, sortable: true }
	];

	gridRows: Record<string, unknown>[] = this.generateGridRows(500);

	gridServerColumns: DataGridColumn[] = [
		{ key: 'id', label: 'ID', width: 70 },
		{ key: 'name', label: 'Name', width: 180, sortable: true },
		{ key: 'event', label: 'Event', width: 220 },
		{
			key: 'status',
			label: 'Status',
			width: 120,
			render: (val: unknown) =>
				html`<ml-badge variant=${val === 'Success' ? 'success' : val === 'Error' ? 'error' : 'warning'} size="sm">${val}</ml-badge>`
		},
		{ key: 'ts', label: 'Timestamp', width: 200 }
	];

	gridServerRows: Record<string, unknown>[] = [
		{ id: 1, name: 'alice@example.com', event: 'User login', status: 'Success', ts: '2026-02-22 09:01:00' },
		{ id: 2, name: 'bob@example.com', event: 'Password reset', status: 'Success', ts: '2026-02-22 09:03:22' },
		{ id: 3, name: 'carol@example.com', event: 'Export data', status: 'Success', ts: '2026-02-22 09:07:45' },
		{ id: 4, name: 'dave@example.com', event: 'User login', status: 'Error', ts: '2026-02-22 09:10:11' },
		{ id: 5, name: 'eve@example.com', event: 'Permission change', status: 'Pending', ts: '2026-02-22 09:12:50' },
		{ id: 6, name: 'frank@example.com', event: 'User login', status: 'Success', ts: '2026-02-22 09:15:00' },
		{ id: 7, name: 'grace@example.com', event: 'Delete record', status: 'Error', ts: '2026-02-22 09:18:30' },
		{ id: 8, name: 'henry@example.com', event: 'Export data', status: 'Pending', ts: '2026-02-22 09:22:00' }
	];

	handleGridSort = (event: CustomEvent): void => {
		console.log('Grid sort:', event.detail);
	};

	handleGridFilter = (event: CustomEvent): void => {
		console.log('Grid filter:', event.detail);
	};

	handleGridSelect = (event: CustomEvent): void => {
		console.log('Grid select:', event.detail);
	};

	private generateGridRows(count: number): Record<string, unknown>[] {
		const firstNames = [
			'Alex',
			'Jordan',
			'Taylor',
			'Morgan',
			'Casey',
			'Riley',
			'Jamie',
			'Avery',
			'Quinn',
			'Blake',
			'Drew',
			'Hayden',
			'Reese',
			'Parker',
			'Logan',
			'Cameron'
		];
		const lastNames = [
			'Smith',
			'Johnson',
			'Williams',
			'Brown',
			'Jones',
			'Garcia',
			'Miller',
			'Davis',
			'Wilson',
			'Anderson',
			'Thomas',
			'Martinez',
			'Harris',
			'Robinson',
			'Clark',
			'Lee'
		];
		const departments = ['Engineering', 'Design', 'Product', 'Marketing', 'Sales', 'Finance', 'HR', 'Operations'];
		const roles = ['Engineer', 'Designer', 'PM', 'Analyst', 'Manager', 'Director', 'Lead', 'Specialist'];
		const statuses = ['Active', 'Active', 'Active', 'Pending', 'Inactive'];

		return Array.from({ length: count }, (_, i) => {
			const first = firstNames[i % firstNames.length];
			const last = lastNames[Math.floor(i / firstNames.length) % lastNames.length];
			const dept = departments[i % departments.length];
			const role = roles[i % roles.length];
			const status = statuses[i % statuses.length];
			const year = 2019 + (i % 6);
			const month = String((i % 12) + 1).padStart(2, '0');
			const day = String((i % 28) + 1).padStart(2, '0');

			return {
				id: i + 1,
				name: `${first} ${last}`,
				email: `${first.toLowerCase()}.${last.toLowerCase()}${i > 15 ? i : ''}@example.com`,
				department: dept,
				role: `${role}`,
				status,
				salary: 60000 + (i % 20) * 5000,
				joined: `${year}-${month}-${day}`
			};
		});
	}
}

// Mount the app
const app = document.getElementById('app');
if (app) {
	app.innerHTML = '<demo-app></demo-app>';
}
