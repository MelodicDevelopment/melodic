import { html, classMap, when } from '@melodicdev/core';
import type { MlModal } from './modal.component';

export const modalTemplate = (c: MlModal) => {
	const hasTitle = !!c.title;
	const hasDescription = !!c.description;
	const hasHeader = hasTitle || hasDescription;

	const backdropClasses = classMap({
		'ml-modal__backdrop': true,
		'ml-modal__backdrop--open': c.open
	});

	const dialogClasses = classMap({
		'ml-modal__dialog': true,
		[`ml-modal__dialog--${c.size}`]: true,
		[`ml-modal__dialog--header-${c.headerLayout}`]: true,
		[`ml-modal__dialog--align-${c.headerAlign}`]: true
	});

	return html`
		<div
			class=${backdropClasses}
			@click=${(e: MouseEvent) => c.handleBackdropClick(e)}
			aria-hidden=${!c.open}
		>
			<div
				class=${dialogClasses}
				role="dialog"
				aria-modal="true"
				aria-labelledby=${hasTitle ? 'ml-modal-title' : undefined}
				aria-describedby=${hasDescription ? 'ml-modal-description' : undefined}
				tabindex="-1"
			>
				<!-- Hero image slot -->
				<div class="ml-modal__hero">
					<slot name="hero"></slot>
				</div>

				<!-- Header -->
				${when(
					hasHeader || c.showClose,
					() => html`
						<div class="ml-modal__header">
							<div class="ml-modal__header-content">
								<div class="ml-modal__icon">
									<slot name="icon"></slot>
								</div>
								<div class="ml-modal__titles">
									${when(
										hasTitle,
										() => html`<h2 id="ml-modal-title" class="ml-modal__title">${c.title}</h2>`
									)}
									${when(
										hasDescription,
										() => html`<p id="ml-modal-description" class="ml-modal__description">${c.description}</p>`
									)}
								</div>
							</div>
							${when(
								c.showClose,
								() => html`
									<button
										type="button"
										class="ml-modal__close"
										@click=${() => c.handleCloseClick()}
										aria-label="Close modal"
									>
										<ml-icon icon="x" size="sm"></ml-icon>
									</button>
								`
							)}
						</div>
					`
				)}

				<!-- Body -->
				<div class="ml-modal__body">
					<slot></slot>
				</div>

				<!-- Footer -->
				<div class="ml-modal__footer">
					<div class="ml-modal__footer-start">
						<slot name="footer-start"></slot>
					</div>
					<div class="ml-modal__footer-end">
						<slot name="footer"></slot>
					</div>
				</div>
			</div>
		</div>
	`;
};
