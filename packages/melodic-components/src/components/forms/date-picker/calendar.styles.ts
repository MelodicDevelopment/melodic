import { css } from '@melodicdev/core';

export const calendarStyles = () => css`
	/*
	 * Tokens. Rules read each one with its default as the var() fallback,
	 * so a value set on the element or inherited from any ancestor wins.
	 *
	 * Calendar
	 * --ml-calendar-width: 280px
	 * --ml-calendar-font-family: var(--ml-font-sans)
	 *
	 * Month/year title
	 * --ml-calendar-month-font-size: var(--ml-text-sm)
	 * --ml-calendar-month-font-weight: var(--ml-font-semibold)
	 * --ml-calendar-month-color: var(--ml-color-text)
	 * --ml-calendar-title-btn-padding-x: var(--ml-space-1-5)
	 * --ml-calendar-title-btn-padding-y: var(--ml-space-1)
	 * --ml-calendar-title-btn-border-radius: var(--ml-radius-md)
	 * --ml-calendar-title-btn-hover-bg: var(--ml-color-surface-raised)
	 * --ml-calendar-title-btn-hover-color: var(--ml-color-text)
	 *
	 * Month/year cells
	 * --ml-calendar-cell-font-size: var(--ml-text-sm)
	 * --ml-calendar-cell-font-weight: var(--ml-font-regular)
	 * --ml-calendar-cell-color: var(--ml-color-text)
	 * --ml-calendar-cell-border-radius: var(--ml-radius-md)
	 * --ml-calendar-cell-hover-bg: var(--ml-color-surface-raised)
	 * --ml-calendar-cell-selected-bg: var(--ml-color-primary)
	 * --ml-calendar-cell-selected-color: var(--ml-color-text-inverse)
	 * --ml-calendar-cell-selected-font-weight: var(--ml-font-semibold)
	 * --ml-calendar-cell-selected-hover-bg: var(--ml-color-primary-hover)
	 * --ml-calendar-cell-current-font-weight: var(--ml-font-semibold)
	 * --ml-calendar-cell-height: 3rem
	 *
	 * Nav buttons
	 * --ml-calendar-nav-size: 2rem
	 * --ml-calendar-nav-border-radius: var(--ml-radius-md)
	 * --ml-calendar-nav-color: var(--ml-color-text-muted)
	 * --ml-calendar-nav-hover-bg: var(--ml-color-surface-raised)
	 * --ml-calendar-nav-hover-color: var(--ml-color-text)
	 *
	 * Weekday headers
	 * --ml-calendar-weekday-height: 2.25rem
	 * --ml-calendar-weekday-font-size: var(--ml-text-xs)
	 * --ml-calendar-weekday-font-weight: var(--ml-font-medium)
	 * --ml-calendar-weekday-color: var(--ml-color-text-muted)
	 *
	 * Day cells
	 * --ml-calendar-day-font-size: var(--ml-text-sm)
	 * --ml-calendar-day-font-weight: var(--ml-font-regular)
	 * --ml-calendar-day-color: var(--ml-color-text)
	 * --ml-calendar-day-border-radius: var(--ml-radius-full)
	 * --ml-calendar-day-hover-bg: var(--ml-color-surface-raised)
	 *
	 * Today
	 * --ml-calendar-today-font-weight: var(--ml-font-semibold)
	 * --ml-calendar-today-dot-size: 4px
	 * --ml-calendar-today-dot-color: var(--ml-color-primary)
	 *
	 * Selected
	 * --ml-calendar-selected-bg: var(--ml-color-primary)
	 * --ml-calendar-selected-color: var(--ml-color-text-inverse)
	 * --ml-calendar-selected-font-weight: var(--ml-font-semibold)
	 * --ml-calendar-selected-hover-bg: var(--ml-color-primary-hover)
	 * --ml-calendar-selected-dot-color: var(--ml-color-text-inverse)
	 *
	 * Disabled
	 * --ml-calendar-disabled-opacity: 0.3
	 *
	 * Focus
	 * --ml-calendar-focus-shadow: var(--ml-shadow-focus-ring)
	 *
	 * Today button
	 * --ml-calendar-today-btn-border-color: var(--ml-color-border)
	 * --ml-calendar-today-btn-border-radius: var(--ml-radius-md)
	 * --ml-calendar-today-btn-bg: var(--ml-color-surface)
	 * --ml-calendar-today-btn-font-size: var(--ml-text-sm)
	 * --ml-calendar-today-btn-font-weight: var(--ml-font-medium)
	 * --ml-calendar-today-btn-color: var(--ml-color-text)
	 * --ml-calendar-today-btn-hover-bg: var(--ml-color-surface-raised)
	 * --ml-calendar-today-btn-hover-border-color: var(--ml-color-border-strong)
	 *
	 * Transition
	 * --ml-calendar-transition-duration: var(--ml-duration-150)
	 * --ml-calendar-transition-easing: var(--ml-ease-in-out)
	 */

	:host {
		display: inline-block;
	}

	.ml-calendar {
		width: var(--ml-calendar-width, 280px);
		font-family: var(--ml-calendar-font-family, var(--ml-font-sans));
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

	.ml-calendar__title {
		display: flex;
		align-items: center;
		gap: var(--ml-space-1);
	}

	.ml-calendar__title-btn {
		border: none;
		background: none;
		padding: var(--ml-calendar-title-btn-padding-y, var(--ml-space-1)) var(--ml-calendar-title-btn-padding-x, var(--ml-space-1-5));
		border-radius: var(--ml-calendar-title-btn-border-radius, var(--ml-radius-md));
		font-family: inherit;
		font-size: var(--ml-calendar-month-font-size, var(--ml-text-sm));
		font-weight: var(--ml-calendar-month-font-weight, var(--ml-font-semibold));
		color: var(--ml-calendar-month-color, var(--ml-color-text));
		cursor: pointer;
		transition: background-color var(--ml-calendar-transition-duration, var(--ml-duration-150)) var(--ml-calendar-transition-easing, var(--ml-ease-in-out)), color var(--ml-calendar-transition-duration, var(--ml-duration-150)) var(--ml-calendar-transition-easing, var(--ml-ease-in-out));
	}

	.ml-calendar__title-btn:hover {
		background-color: var(--ml-calendar-title-btn-hover-bg, var(--ml-color-surface-raised));
		color: var(--ml-calendar-title-btn-hover-color, var(--ml-color-text));
	}

	.ml-calendar__title-btn:focus-visible {
		outline: none;
		box-shadow: var(--ml-calendar-focus-shadow, var(--ml-shadow-focus-ring));
	}

	.ml-calendar__title-btn--wide {
		min-width: 0;
	}

	/* Month / year cell grid */
	.ml-calendar__cell-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: var(--ml-space-1);
		padding: var(--ml-space-1) 0;
	}

	.ml-calendar__cell {
		display: flex;
		align-items: center;
		justify-content: center;
		height: var(--ml-calendar-cell-height, 3rem);
		border: none;
		border-radius: var(--ml-calendar-cell-border-radius, var(--ml-radius-md));
		background: none;
		font-family: inherit;
		font-size: var(--ml-calendar-cell-font-size, var(--ml-text-sm));
		font-weight: var(--ml-calendar-cell-font-weight, var(--ml-font-regular));
		color: var(--ml-calendar-cell-color, var(--ml-color-text));
		cursor: pointer;
		padding: 0;
		transition:
			background-color var(--ml-calendar-transition-duration, var(--ml-duration-150)) var(--ml-calendar-transition-easing, var(--ml-ease-in-out)),
			color var(--ml-calendar-transition-duration, var(--ml-duration-150)) var(--ml-calendar-transition-easing, var(--ml-ease-in-out));
	}

	.ml-calendar__cell:hover:not(:disabled):not(.ml-calendar__cell--selected) {
		background-color: var(--ml-calendar-cell-hover-bg, var(--ml-color-surface-raised));
	}

	.ml-calendar__cell:focus-visible {
		outline: none;
		box-shadow: var(--ml-calendar-focus-shadow, var(--ml-shadow-focus-ring));
		z-index: 1;
	}

	.ml-calendar__cell--current {
		font-weight: var(--ml-calendar-cell-current-font-weight, var(--ml-font-semibold));
	}

	.ml-calendar__cell--selected {
		background-color: var(--ml-calendar-cell-selected-bg, var(--ml-color-primary));
		color: var(--ml-calendar-cell-selected-color, var(--ml-color-text-inverse));
		font-weight: var(--ml-calendar-cell-selected-font-weight, var(--ml-font-semibold));
	}

	.ml-calendar__cell--selected:hover:not(:disabled) {
		background-color: var(--ml-calendar-cell-selected-hover-bg, var(--ml-color-primary-hover));
	}

	.ml-calendar__cell--disabled,
	.ml-calendar__cell:disabled {
		opacity: var(--ml-calendar-disabled-opacity, 0.3);
		cursor: not-allowed;
	}

	.ml-calendar__nav {
		display: flex;
		align-items: center;
		justify-content: center;
		width: var(--ml-calendar-nav-size, 2rem);
		height: var(--ml-calendar-nav-size, 2rem);
		border: none;
		border-radius: var(--ml-calendar-nav-border-radius, var(--ml-radius-md));
		background: none;
		color: var(--ml-calendar-nav-color, var(--ml-color-text-muted));
		cursor: pointer;
		transition: background-color var(--ml-calendar-transition-duration, var(--ml-duration-150)) var(--ml-calendar-transition-easing, var(--ml-ease-in-out)), color var(--ml-calendar-transition-duration, var(--ml-duration-150)) var(--ml-calendar-transition-easing, var(--ml-ease-in-out));
	}

	.ml-calendar__nav:hover {
		background-color: var(--ml-calendar-nav-hover-bg, var(--ml-color-surface-raised));
		color: var(--ml-calendar-nav-hover-color, var(--ml-color-text));
	}

	.ml-calendar__nav:focus-visible {
		outline: none;
		box-shadow: var(--ml-calendar-focus-shadow, var(--ml-shadow-focus-ring));
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
		height: var(--ml-calendar-weekday-height, 2.25rem);
		font-size: var(--ml-calendar-weekday-font-size, var(--ml-text-xs));
		font-weight: var(--ml-calendar-weekday-font-weight, var(--ml-font-medium));
		color: var(--ml-calendar-weekday-color, var(--ml-color-text-muted));
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
		border-radius: var(--ml-calendar-day-border-radius, var(--ml-radius-full));
		background: none;
		font-size: var(--ml-calendar-day-font-size, var(--ml-text-sm));
		font-weight: var(--ml-calendar-day-font-weight, var(--ml-font-regular));
		color: var(--ml-calendar-day-color, var(--ml-color-text));
		cursor: pointer;
		padding: 0;
		gap: 1px;
		transition:
			background-color var(--ml-calendar-transition-duration, var(--ml-duration-150)) var(--ml-calendar-transition-easing, var(--ml-ease-in-out)),
			color var(--ml-calendar-transition-duration, var(--ml-duration-150)) var(--ml-calendar-transition-easing, var(--ml-ease-in-out));
	}

	.ml-calendar__day:hover:not(:disabled):not(.ml-calendar__day--selected) {
		background-color: var(--ml-calendar-day-hover-bg, var(--ml-color-surface-raised));
	}

	.ml-calendar__day:focus-visible {
		outline: none;
		box-shadow: var(--ml-calendar-focus-shadow, var(--ml-shadow-focus-ring));
		z-index: 1;
	}

	/* Other month days - hidden */
	.ml-calendar__day--other-month {
		visibility: hidden;
		pointer-events: none;
	}

	/* Today */
	.ml-calendar__day--today {
		font-weight: var(--ml-calendar-today-font-weight, var(--ml-font-semibold));
	}

	.ml-calendar__day-number {
		line-height: 1;
	}

	/* Today dot indicator */
	.ml-calendar__today-dot {
		width: var(--ml-calendar-today-dot-size, 4px);
		height: var(--ml-calendar-today-dot-size, 4px);
		border-radius: var(--ml-calendar-day-border-radius, var(--ml-radius-full));
		background-color: var(--ml-calendar-today-dot-color, var(--ml-color-primary));
	}

	.ml-calendar__day--selected .ml-calendar__today-dot {
		background-color: var(--ml-calendar-selected-dot-color, var(--ml-color-text-inverse));
	}

	/* Selected */
	.ml-calendar__day--selected {
		background-color: var(--ml-calendar-selected-bg, var(--ml-color-primary));
		color: var(--ml-calendar-selected-color, var(--ml-color-text-inverse));
		font-weight: var(--ml-calendar-selected-font-weight, var(--ml-font-semibold));
	}

	.ml-calendar__day--selected:hover:not(:disabled) {
		background-color: var(--ml-calendar-selected-hover-bg, var(--ml-color-primary-hover));
	}

	/* Disabled */
	.ml-calendar__day--disabled:not(.ml-calendar__day--other-month) {
		opacity: var(--ml-calendar-disabled-opacity, 0.3);
		cursor: not-allowed;
	}

	/* Footer */
	.ml-calendar__footer {
		display: flex;
		justify-content: center;
		padding-top: var(--ml-space-3);
	}

	.ml-calendar__today-btn {
		border: var(--ml-border) solid var(--ml-calendar-today-btn-border-color, var(--ml-color-border));
		border-radius: var(--ml-calendar-today-btn-border-radius, var(--ml-radius-md));
		background-color: var(--ml-calendar-today-btn-bg, var(--ml-color-surface));
		font-family: var(--ml-calendar-font-family, var(--ml-font-sans));
		font-size: var(--ml-calendar-today-btn-font-size, var(--ml-text-sm));
		font-weight: var(--ml-calendar-today-btn-font-weight, var(--ml-font-medium));
		color: var(--ml-calendar-today-btn-color, var(--ml-color-text));
		padding: var(--ml-space-1-5) var(--ml-space-3);
		cursor: pointer;
		transition: background-color var(--ml-calendar-transition-duration, var(--ml-duration-150)) var(--ml-calendar-transition-easing, var(--ml-ease-in-out)), border-color var(--ml-calendar-transition-duration, var(--ml-duration-150)) var(--ml-calendar-transition-easing, var(--ml-ease-in-out));
	}

	.ml-calendar__today-btn:hover {
		background-color: var(--ml-calendar-today-btn-hover-bg, var(--ml-color-surface-raised));
		border-color: var(--ml-calendar-today-btn-hover-border-color, var(--ml-color-border-strong));
	}

	.ml-calendar__today-btn:focus-visible {
		outline: none;
		box-shadow: var(--ml-calendar-focus-shadow, var(--ml-shadow-focus-ring));
	}
`;
