import { css } from '@melodicdev/core';

export const dashboardPageStyles = () => css`
	:host {
		display: block;
		height: 100%;

		/* Font */
		--ml-dashboard-font-family: var(--ml-font-sans);

		/* Padding */
		--ml-dashboard-padding: var(--ml-space-6);
		--ml-dashboard-mobile-padding: var(--ml-space-4);

		/* Metrics grid */
		--ml-dashboard-metrics-min-width: 200px;
		--ml-dashboard-metrics-gap: var(--ml-space-4);
		--ml-dashboard-metrics-margin: var(--ml-space-6);
		--ml-dashboard-metrics-mobile-gap: var(--ml-space-3);
		--ml-dashboard-metrics-mobile-margin: var(--ml-space-4);

		/* Body grid */
		--ml-dashboard-body-gap: var(--ml-space-6);
		--ml-dashboard-body-mobile-gap: var(--ml-space-4);

		/* Main & aside */
		--ml-dashboard-main-gap: var(--ml-space-6);
		--ml-dashboard-aside-gap: var(--ml-space-6);
	}

	/* ============================================
	   DASHBOARD CONTENT AREA
	   ============================================ */
	.ml-dashboard {
		padding: var(--ml-dashboard-padding);
		font-family: var(--ml-dashboard-font-family);
	}

	/* ============================================
	   METRICS ROW
	   ============================================ */
	.ml-dashboard__metrics {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(var(--ml-dashboard-metrics-min-width), 1fr));
		gap: var(--ml-dashboard-metrics-gap);
		margin-bottom: var(--ml-dashboard-metrics-margin);
	}

	/* ============================================
	   BODY (MAIN + ASIDE GRID)
	   ============================================ */
	.ml-dashboard__body {
		display: grid;
		grid-template-columns: 1fr;
		gap: var(--ml-dashboard-body-gap);
	}

	/* Default layout: 2/3 main + 1/3 aside */
	.ml-dashboard--default .ml-dashboard__body {
		grid-template-columns: 2fr 1fr;
	}

	/* Wide layout: full-width main, aside below */
	.ml-dashboard--wide .ml-dashboard__body {
		grid-template-columns: 1fr;
	}

	/* Full layout: main only, no aside */
	.ml-dashboard--full .ml-dashboard__body {
		grid-template-columns: 1fr;
	}

	/* ============================================
	   MAIN CONTENT
	   ============================================ */
	.ml-dashboard__main {
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: var(--ml-dashboard-main-gap);
	}

	/* ============================================
	   ASIDE
	   ============================================ */
	.ml-dashboard__aside {
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: var(--ml-dashboard-aside-gap);
	}

	/* ============================================
	   RESPONSIVE
	   ============================================ */
	@media (max-width: 1024px) {
		.ml-dashboard--default .ml-dashboard__body {
			grid-template-columns: 1fr;
		}
	}

	@media (max-width: 640px) {
		.ml-dashboard {
			padding: var(--ml-dashboard-mobile-padding);
		}

		.ml-dashboard__metrics {
			grid-template-columns: 1fr;
			gap: var(--ml-dashboard-metrics-mobile-gap);
			margin-bottom: var(--ml-dashboard-metrics-mobile-margin);
		}

		.ml-dashboard__body {
			gap: var(--ml-dashboard-body-mobile-gap);
		}
	}
`;
