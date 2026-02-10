import { MelodicComponent } from '@melodicdev/core';
import type { IElementRef, OnCreate, OnDestroy, OnRender } from '@melodicdev/core';
import type { StepsVariant, StepsOrientation, StepsConnector, StepsColor, StepConfig, StepStatus } from './steps.types.js';
import { stepsTemplate } from './steps.template.js';
import { stepsStyles } from './steps.styles.js';

/**
 * ml-steps - Multi-step progress/wizard component
 *
 * @example Config array mode:
 * ```html
 * <ml-steps active="company" variant="circles" .steps=${stepConfigs}>
 *   <ml-step-panel value="details">Step 1 content</ml-step-panel>
 *   <ml-step-panel value="company">Step 2 content</ml-step-panel>
 * </ml-steps>
 * ```
 *
 * @example Slotted mode:
 * ```html
 * <ml-steps active="company" variant="numbered">
 *   <ml-step slot="step" value="details" label="Your details"></ml-step>
 *   <ml-step slot="step" value="company" label="Company"></ml-step>
 *   <ml-step-panel value="details">Content 1</ml-step-panel>
 *   <ml-step-panel value="company">Content 2</ml-step-panel>
 * </ml-steps>
 * ```
 *
 * @slot step - Step header elements (ml-step)
 * @slot default - Step panel content or router-outlet
 *
 * @fires ml:change - Emitted when active step changes
 */
@MelodicComponent({
	selector: 'ml-steps',
	template: stepsTemplate,
	styles: stepsStyles,
	attributes: ['active', 'variant', 'orientation', 'connector', 'color', 'compact', 'routed']
})
export class StepsComponent implements IElementRef, OnCreate, OnDestroy, OnRender {
	elementRef!: HTMLElement;

	/** Currently active step value */
	active = '';

	/** Visual variant */
	variant: StepsVariant = 'numbered';

	/** Layout orientation */
	orientation: StepsOrientation = 'horizontal';

	/** Connector line style */
	connector: StepsConnector = 'solid';

	/** Accent color */
	color: StepsColor = 'primary';

	/** Compact dots mode */
	compact = false;

	/** Enable router integration */
	routed = false;

	/** Step configurations (alternative to slotted ml-step elements) */
	steps: StepConfig[] = [];

	/** Internal tracking of slotted steps */
	_slottedSteps: HTMLElement[] = [];

	/** Navigation event listener for routed mode */
	private readonly _handleNavigation = this.onNavigation.bind(this);

	onCreate(): void {
		// Listen for step click events from slotted ml-step elements
		this.elementRef.addEventListener('ml:step-click', this.handleSlottedStepClick as EventListener);

		if (this.routed) {
			window.addEventListener('NavigationEvent', this._handleNavigation);
			this.syncWithRoute();
		}
	}

	onRender(): void {
		this.updatePanelVisibility();
	}

	onDestroy(): void {
		this.elementRef.removeEventListener('ml:step-click', this.handleSlottedStepClick as EventListener);

		if (this.routed) {
			window.removeEventListener('NavigationEvent', this._handleNavigation);
		}
	}

	/** Handle step slot changes */
	handleStepSlotChange = (event: Event): void => {
		const slot = event.target as HTMLSlotElement;
		this._slottedSteps = slot.assignedElements({ flatten: true }) as HTMLElement[];

		// Set initial value if not set
		if (!this.active && this._slottedSteps.length > 0) {
			const firstStep = this._slottedSteps.find((step) => !step.hasAttribute('disabled'));
			if (firstStep) {
				this.active = firstStep.getAttribute('value') || '';
			}
		}

		this.updateSlottedStepStates();
		this.updatePanelVisibility();
	};

	/** Handle step click (config mode) */
	handleStepClick = (stepValue: string, href?: string): void => {
		const step = this.getStepByValue(stepValue);
		if (step?.disabled) return;

		if (this.routed && href) {
			window.history.pushState({}, '', href);
			window.dispatchEvent(new PopStateEvent('popstate'));
		}

		this.active = stepValue;
		this.updateSlottedStepStates();
		this.updatePanelVisibility();

		this.elementRef.dispatchEvent(
			new CustomEvent('ml:change', {
				bubbles: true,
				composed: true,
				detail: { value: stepValue }
			})
		);
	};

	/** Handle slotted step click event */
	private handleSlottedStepClick = (event: CustomEvent): void => {
		const { value, href } = event.detail;
		this.handleStepClick(value, href);
	};

	/** Handle keyboard navigation */
	handleKeyDown = (event: KeyboardEvent): void => {
		const allSteps = this.getAllSteps();
		const enabledSteps = allSteps.filter((s) => !s.disabled);
		const currentIndex = enabledSteps.findIndex((s) => s.value === this.active);

		let newIndex = currentIndex;
		const isVertical = this.orientation === 'vertical';

		switch (event.key) {
			case 'ArrowLeft':
				if (isVertical) return;
				event.preventDefault();
				newIndex = currentIndex > 0 ? currentIndex - 1 : enabledSteps.length - 1;
				break;
			case 'ArrowRight':
				if (isVertical) return;
				event.preventDefault();
				newIndex = currentIndex < enabledSteps.length - 1 ? currentIndex + 1 : 0;
				break;
			case 'ArrowUp':
				if (!isVertical) return;
				event.preventDefault();
				newIndex = currentIndex > 0 ? currentIndex - 1 : enabledSteps.length - 1;
				break;
			case 'ArrowDown':
				if (!isVertical) return;
				event.preventDefault();
				newIndex = currentIndex < enabledSteps.length - 1 ? currentIndex + 1 : 0;
				break;
			case 'Home':
				event.preventDefault();
				newIndex = 0;
				break;
			case 'End':
				event.preventDefault();
				newIndex = enabledSteps.length - 1;
				break;
			default:
				return;
		}

		if (newIndex !== currentIndex && enabledSteps[newIndex]) {
			const step = enabledSteps[newIndex];
			this.handleStepClick(step.value, step.href);
			this.focusStep(step.value);
		}
	};

	/** Get status for a step based on its position relative to active */
	getStepStatus(stepValue: string): StepStatus {
		const allSteps = this.getAllSteps();
		const activeIndex = allSteps.findIndex((s) => s.value === this.active);
		const stepIndex = allSteps.findIndex((s) => s.value === stepValue);

		if (stepIndex < activeIndex) return 'completed';
		if (stepIndex === activeIndex) return 'current';
		return 'upcoming';
	}

	/** Get current step index (1-based, for compact label) */
	getCurrentStepNumber(): number {
		const allSteps = this.getAllSteps();
		const index = allSteps.findIndex((s) => s.value === this.active);
		return index + 1;
	}

	/** Get total step count */
	getTotalSteps(): number {
		return this.getAllSteps().length;
	}

	/** Get all steps (from config or slotted) */
	getAllSteps(): StepConfig[] {
		if (this.steps.length > 0) {
			return this.steps;
		}

		return this._slottedSteps.map((el) => ({
			value: el.getAttribute('value') || '',
			label: el.getAttribute('label') || el.textContent || '',
			description: el.getAttribute('description') || undefined,
			icon: el.getAttribute('icon') || undefined,
			disabled: el.hasAttribute('disabled'),
			href: el.getAttribute('href') || undefined
		}));
	}

	/** Get step by value */
	private getStepByValue(value: string): StepConfig | undefined {
		return this.getAllSteps().find((s) => s.value === value);
	}

	/** Update attributes on slotted steps */
	private updateSlottedStepStates(): void {
		const allSteps = this.getAllSteps();
		this._slottedSteps.forEach((step, index) => {
			const value = step.getAttribute('value') || '';
			const status = this.getStepStatus(value);
			step.setAttribute('status', status);
			step.setAttribute('variant', this.variant);
			step.setAttribute('connector', this.connector);
			step.setAttribute('color', this.color);
			step.setAttribute('orientation', this.orientation);
			step.setAttribute('step-number', String(index + 1));
			step.toggleAttribute('first', index === 0);
			step.toggleAttribute('last', index === allSteps.length - 1);
			step.toggleAttribute('compact', this.compact);
		});
	}

	/** Update panel visibility */
	private updatePanelVisibility(): void {
		if (this.routed) return;

		const panels = this.elementRef.querySelectorAll('ml-step-panel');
		panels.forEach((panel) => {
			const isActive = panel.getAttribute('value') === this.active;
			(panel as HTMLElement).style.display = isActive ? '' : 'none';
		});
	}

	/** Focus a specific step button */
	private focusStep(value: string): void {
		const stepList = this.elementRef.shadowRoot?.querySelector('.ml-steps__list');
		const button = stepList?.querySelector(`[data-value="${value}"]`) as HTMLElement;
		button?.focus();
	}

	/** Sync active step with current route */
	private syncWithRoute(): void {
		const path = window.location.pathname;
		const matchingStep = this.getAllSteps().find((step) => step.href && path.startsWith(step.href));
		if (matchingStep) {
			this.active = matchingStep.value;
			this.updateSlottedStepStates();
		}
	}

	/** Handle navigation events (routed mode) */
	private onNavigation(): void {
		this.syncWithRoute();
	}
}
