import { html, classMap, when } from '@melodicdev/core';
import type { MlModalHost } from './modal-host.component';

export const modalHostTemplate = (c: MlModalHost) => {
	// Use fallbacks for undefined values
	const size = c.size || 'md';
	const headerLayout = c.headerLayout || 'inline';
	const headerAlign = c.headerAlign || 'left';
	// Handle both boolean true and string "true" from attribute
	const openValue = c.open as boolean | string;
	const isOpen = openValue === true || openValue === 'true' || openValue === '';

	const backdropClasses = classMap({
		'ml-modal-host__backdrop': true,
		'ml-modal-host__backdrop--open': isOpen
	});

	const dialogClasses = classMap({
		'ml-modal-host__dialog': true,
		[`ml-modal-host__dialog--${size}`]: true,
		[`ml-modal-host__dialog--header-${headerLayout}`]: true,
		[`ml-modal-host__dialog--align-${headerAlign}`]: true
	});

	// Safely handle click events - check if method exists
	const onBackdropClick = (e: MouseEvent) => {
		if (typeof c.handleBackdropClick === 'function') {
			c.handleBackdropClick(e);
		}
	};

	const onCloseClick = () => {
		if (typeof c.handleCloseClick === 'function') {
			c.handleCloseClick();
		}
	};

	return html`
		<div
			class=${backdropClasses}
			@click=${onBackdropClick}
			aria-hidden=${!c.open}
		>
			<div
				class=${dialogClasses}
				role="dialog"
				aria-modal="true"
				tabindex="-1"
			>
				${when(
					c.showClose,
					() => html`
						<button
							type="button"
							class="ml-modal-host__close"
							@click=${onCloseClick}
							aria-label="Close modal"
						>
							<ml-icon icon="x" size="sm"></ml-icon>
						</button>
					`
				)}

				<div class="ml-modal-host__content">
					<!-- Content component will be mounted here -->
				</div>
			</div>
		</div>
	`;
};
