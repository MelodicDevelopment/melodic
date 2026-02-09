import { css } from '@melodicdev/core';

export const calendarStyles = () => css`
	:host {
		display: inline-block;
	}

	.ml-calendar {
		width: 280px;
		font-family: var(--ml-font-sans);
	}

	/* Header with nav */
	.ml-calendar__header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 0 var(--ml-space-3) 0;
	}

	.ml-calendar__nav-group {
		display: flex;
		align-items: center;
		gap: 0;
	}

	.ml-calendar__month-label {
		font-size: var(--ml-text-sm);
		font-weight: var(--ml-font-semibold);
		color: var(--ml-color-text);
	}

	.ml-calendar__nav {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		border: none;
		border-radius: var(--ml-radius-md);
		background: none;
		color: var(--ml-color-text-muted);
		cursor: pointer;
		transition: background-color var(--ml-duration-150) var(--ml-ease-in-out), color var(--ml-duration-150) var(--ml-ease-in-out);
	}

	.ml-calendar__nav:hover {
		background-color: var(--ml-color-surface-raised);
		color: var(--ml-color-text);
	}

	.ml-calendar__nav:focus-visible {
		outline: none;
		box-shadow: var(--ml-shadow-focus-ring);
	}

	/* Weekday headers */
	.ml-calendar__weekdays {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		gap: 0;
		margin-bottom: var(--ml-space-1);
	}

	.ml-calendar__weekday {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 2.25rem;
		font-size: var(--ml-text-xs);
		font-weight: var(--ml-font-medium);
		color: var(--ml-color-text-muted);
	}

	/* Day grid */
	.ml-calendar__grid {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		gap: 0;
	}

	.ml-calendar__day {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		width: 100%;
		aspect-ratio: 1;
		border: none;
		border-radius: var(--ml-radius-full);
		background: none;
		font-size: var(--ml-text-sm);
		font-weight: var(--ml-font-regular);
		color: var(--ml-color-text);
		cursor: pointer;
		padding: 0;
		gap: 1px;
		transition:
			background-color var(--ml-duration-150) var(--ml-ease-in-out),
			color var(--ml-duration-150) var(--ml-ease-in-out);
	}

	.ml-calendar__day:hover:not(:disabled):not(.ml-calendar__day--selected) {
		background-color: var(--ml-color-surface-raised);
	}

	.ml-calendar__day:focus-visible {
		outline: none;
		box-shadow: var(--ml-shadow-focus-ring);
		z-index: 1;
	}

	/* Other month days - hidden */
	.ml-calendar__day--other-month {
		visibility: hidden;
		pointer-events: none;
	}

	/* Today */
	.ml-calendar__day--today {
		font-weight: var(--ml-font-semibold);
	}

	.ml-calendar__day-number {
		line-height: 1;
	}

	/* Today dot indicator */
	.ml-calendar__today-dot {
		width: 4px;
		height: 4px;
		border-radius: var(--ml-radius-full);
		background-color: var(--ml-color-primary);
	}

	.ml-calendar__day--selected .ml-calendar__today-dot {
		background-color: var(--ml-color-text-inverse);
	}

	/* Selected */
	.ml-calendar__day--selected {
		background-color: var(--ml-color-primary);
		color: var(--ml-color-text-inverse);
		font-weight: var(--ml-font-semibold);
	}

	.ml-calendar__day--selected:hover:not(:disabled) {
		background-color: var(--ml-color-primary-hover);
	}

	/* Disabled */
	.ml-calendar__day--disabled:not(.ml-calendar__day--other-month) {
		opacity: 0.3;
		cursor: not-allowed;
	}

	/* Footer */
	.ml-calendar__footer {
		display: flex;
		justify-content: center;
		padding-top: var(--ml-space-3);
	}

	.ml-calendar__today-btn {
		border: var(--ml-border) solid var(--ml-color-border);
		border-radius: var(--ml-radius-md);
		background-color: var(--ml-color-surface);
		font-family: var(--ml-font-sans);
		font-size: var(--ml-text-sm);
		font-weight: var(--ml-font-medium);
		color: var(--ml-color-text);
		padding: var(--ml-space-1-5) var(--ml-space-3);
		cursor: pointer;
		transition: background-color var(--ml-duration-150) var(--ml-ease-in-out), border-color var(--ml-duration-150) var(--ml-ease-in-out);
	}

	.ml-calendar__today-btn:hover {
		background-color: var(--ml-color-surface-raised);
		border-color: var(--ml-color-border-strong);
	}

	.ml-calendar__today-btn:focus-visible {
		outline: none;
		box-shadow: var(--ml-shadow-focus-ring);
	}
`;
