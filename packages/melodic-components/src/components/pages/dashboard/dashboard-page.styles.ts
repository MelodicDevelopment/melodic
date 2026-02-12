import { css } from '@melodicdev/core';

export const dashboardPageStyles = () => css`
	:host {
		display: block;
		height: 100%;
	}

	/* ============================================
	   DASHBOARD CONTENT AREA
	   ============================================ */
	.ml-dashboard {
		padding: var(--ml-space-6);
		font-family: var(--ml-font-sans);
	}

	/* ============================================
	   METRICS ROW
	   ============================================ */
	.ml-dashboard__metrics {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: var(--ml-space-4);
		margin-bottom: var(--ml-space-6);
	}

	/* ============================================
	   BODY (MAIN + ASIDE GRID)
	   ============================================ */
	.ml-dashboard__body {
		display: grid;
		grid-template-columns: 1fr;
		gap: var(--ml-space-6);
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
		gap: var(--ml-space-6);
	}

	/* ============================================
	   ASIDE
	   ============================================ */
	.ml-dashboard__aside {
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: var(--ml-space-6);
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
			padding: var(--ml-space-4);
		}

		.ml-dashboard__metrics {
			grid-template-columns: 1fr;
			gap: var(--ml-space-3);
			margin-bottom: var(--ml-space-4);
		}

		.ml-dashboard__body {
			gap: var(--ml-space-4);
		}
	}
`;
