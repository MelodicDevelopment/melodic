import { css } from '@melodicdev/core';

export const calendarViewStyles = () => css`
	:host {
		display: block;
		font-family: var(--ml-font-sans);

		/* ── Calendar View: surface ── */
		--ml-calendar-view-bg: var(--ml-color-surface);
		--ml-calendar-view-border-width: var(--ml-border);
		--ml-calendar-view-border-color: var(--ml-color-border);
		--ml-calendar-view-radius: var(--ml-radius-lg);

		/* ── Calendar View: header ── */
		--ml-calendar-view-header-padding: var(--ml-space-4) var(--ml-space-5);
		--ml-calendar-view-title-size: var(--ml-text-lg);
		--ml-calendar-view-title-weight: var(--ml-font-semibold);
		--ml-calendar-view-title-color: var(--ml-color-text);
		--ml-calendar-view-subtitle-color: var(--ml-color-text-muted);

		/* ── Calendar View: today badge ── */
		--ml-calendar-view-today-badge-bg: var(--ml-color-primary);
		--ml-calendar-view-today-badge-color: var(--ml-color-text-inverse);

		/* ── Calendar View: navigation buttons ── */
		--ml-calendar-view-nav-color: var(--ml-color-text-muted);
		--ml-calendar-view-nav-hover-bg: var(--ml-color-surface-raised);
		--ml-calendar-view-nav-hover-color: var(--ml-color-text);

		/* ── Calendar View: day cells ── */
		--ml-calendar-view-cell-min-height: 120px;
		--ml-calendar-view-cell-hover-bg: var(--ml-color-surface-sunken);
		--ml-calendar-view-cell-other-bg: var(--ml-color-surface-sunken);
		--ml-calendar-view-cell-other-color: var(--ml-color-text-disabled);

		/* ── Calendar View: today indicator ── */
		--ml-calendar-view-today-bg: var(--ml-color-primary);
		--ml-calendar-view-today-color: var(--ml-color-text-inverse);

		/* ── Calendar View: weekday header ── */
		--ml-calendar-view-weekday-color: var(--ml-color-text-muted);
		--ml-calendar-view-weekday-today-color: var(--ml-color-primary);

		/* ── Calendar View: event pill ── */
		--ml-calendar-view-event-radius: var(--ml-radius-sm);
		--ml-calendar-view-event-border-width: 3px;

		/* ── Calendar View: week badge ── */
		--ml-calendar-view-week-badge-color: var(--ml-color-primary);
		--ml-calendar-view-week-badge-bg: var(--ml-purple-50);

		/* ── Calendar View: add button ── */
		--ml-calendar-view-add-bg: var(--ml-color-primary);
		--ml-calendar-view-add-hover-bg: var(--ml-color-primary-hover);
		--ml-calendar-view-add-color: var(--ml-color-text-inverse);

		/* ── Calendar View: view menu ── */
		--ml-calendar-view-menu-bg: var(--ml-color-surface);
		--ml-calendar-view-menu-shadow: var(--ml-shadow-lg);
		--ml-calendar-view-menu-active-color: var(--ml-color-primary);

		/* ── Calendar View: sidebar ── */
		--ml-calendar-view-sidebar-event-hover-bg: var(--ml-color-surface-raised);

		/* ── Calendar View: mini calendar ── */
		--ml-calendar-view-mini-selected-bg: var(--ml-color-primary);
		--ml-calendar-view-mini-selected-hover-bg: var(--ml-color-primary-hover);
		--ml-calendar-view-mini-selected-color: var(--ml-color-text-inverse);
		--ml-calendar-view-mini-dot-color: var(--ml-color-primary);

		/* ── Calendar View: focus ring ── */
		--ml-calendar-view-focus-ring: var(--ml-shadow-focus-ring);
	}

	.ml-cv {
		border: var(--ml-calendar-view-border-width) solid var(--ml-calendar-view-border-color);
		border-radius: var(--ml-calendar-view-radius);
		background-color: var(--ml-calendar-view-bg);
		overflow: hidden;
	}

	/* ── Header ── */
	.ml-cv__header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--ml-space-4);
		padding: var(--ml-calendar-view-header-padding);
		border-bottom: var(--ml-calendar-view-border-width) solid var(--ml-calendar-view-border-color);
	}

	.ml-cv__header-left {
		display: flex;
		align-items: center;
		gap: var(--ml-space-3);
	}

	.ml-cv__today-badge {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		width: 2.75rem;
		height: 2.75rem;
		border-radius: var(--ml-calendar-view-radius);
		background-color: var(--ml-calendar-view-today-badge-bg);
		color: var(--ml-calendar-view-today-badge-color);
		line-height: 1;
		flex-shrink: 0;
	}

	.ml-cv__today-badge-month {
		font-size: 0.5625rem;
		font-weight: var(--ml-font-semibold);
		text-transform: uppercase;
		letter-spacing: 0.02em;
	}

	.ml-cv__today-badge-day {
		font-size: var(--ml-text-lg);
		font-weight: var(--ml-font-bold);
	}

	.ml-cv__title-group {
		display: flex;
		flex-direction: column;
		gap: var(--ml-space-0-5);
	}

	.ml-cv__title-row {
		display: flex;
		align-items: center;
		gap: var(--ml-space-2);
	}

	.ml-cv__title {
		font-size: var(--ml-calendar-view-title-size);
		font-weight: var(--ml-calendar-view-title-weight);
		color: var(--ml-calendar-view-title-color);
		margin: 0;
	}

	.ml-cv__week-badge {
		font-size: var(--ml-text-xs);
		font-weight: var(--ml-font-medium);
		color: var(--ml-calendar-view-week-badge-color);
		background-color: var(--ml-calendar-view-week-badge-bg);
		padding: var(--ml-space-0-5) var(--ml-space-2);
		border-radius: var(--ml-radius-full);
	}

	.ml-cv__subtitle {
		font-size: var(--ml-text-sm);
		color: var(--ml-calendar-view-subtitle-color);
	}

	.ml-cv__header-right {
		display: flex;
		align-items: center;
		gap: var(--ml-space-2);
	}

	/* Slotted header content */
	::slotted([slot="header-left"]) {
		display: flex;
		align-items: center;
		gap: var(--ml-space-3);
	}

	::slotted([slot="header-actions"]) {
		display: flex;
		align-items: center;
		gap: var(--ml-space-2);
	}

	.ml-cv__nav-group {
		display: flex;
		align-items: center;
		border: var(--ml-calendar-view-border-width) solid var(--ml-calendar-view-border-color);
		border-radius: var(--ml-radius-md);
		overflow: hidden;
	}

	.ml-cv__nav-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2.25rem;
		height: 2.25rem;
		border: none;
		background: none;
		color: var(--ml-calendar-view-nav-color);
		cursor: pointer;
		transition: background-color var(--ml-duration-150) var(--ml-ease-in-out), color var(--ml-duration-150) var(--ml-ease-in-out);
	}

	.ml-cv__nav-btn:hover {
		background-color: var(--ml-calendar-view-nav-hover-bg);
		color: var(--ml-calendar-view-nav-hover-color);
	}

	.ml-cv__nav-btn:focus-visible {
		outline: none;
		box-shadow: var(--ml-calendar-view-focus-ring);
		z-index: 1;
	}

	.ml-cv__nav-btn + .ml-cv__nav-btn {
		border-left: var(--ml-calendar-view-border-width) solid var(--ml-calendar-view-border-color);
	}

	.ml-cv__today-btn {
		height: 2.25rem;
		padding: 0 var(--ml-space-3);
		border: var(--ml-calendar-view-border-width) solid var(--ml-calendar-view-border-color);
		border-radius: var(--ml-radius-md);
		background: none;
		font-family: var(--ml-font-sans);
		font-size: var(--ml-text-sm);
		font-weight: var(--ml-font-medium);
		color: var(--ml-calendar-view-title-color);
		cursor: pointer;
		transition: background-color var(--ml-duration-150) var(--ml-ease-in-out);
	}

	.ml-cv__today-btn:hover {
		background-color: var(--ml-calendar-view-nav-hover-bg);
	}

	.ml-cv__today-btn:focus-visible {
		outline: none;
		box-shadow: var(--ml-calendar-view-focus-ring);
	}

	/* View dropdown */
	.ml-cv__view-dropdown {
		position: relative;
	}

	.ml-cv__view-trigger {
		display: flex;
		align-items: center;
		gap: var(--ml-space-1-5);
		height: 2.25rem;
		padding: 0 var(--ml-space-3);
		border: var(--ml-calendar-view-border-width) solid var(--ml-calendar-view-border-color);
		border-radius: var(--ml-radius-md);
		background: none;
		font-family: var(--ml-font-sans);
		font-size: var(--ml-text-sm);
		font-weight: var(--ml-font-medium);
		color: var(--ml-calendar-view-title-color);
		cursor: pointer;
		transition: background-color var(--ml-duration-150) var(--ml-ease-in-out);
	}

	.ml-cv__view-trigger:hover {
		background-color: var(--ml-calendar-view-nav-hover-bg);
	}

	.ml-cv__view-trigger:focus-visible {
		outline: none;
		box-shadow: var(--ml-calendar-view-focus-ring);
	}

	.ml-cv__view-trigger ml-icon {
		transition: transform var(--ml-duration-150) var(--ml-ease-in-out);
	}

	.ml-cv__view-trigger--open ml-icon {
		transform: rotate(180deg);
	}

	.ml-cv__view-menu {
		position: absolute;
		top: calc(100% + 4px);
		right: 0;
		min-width: 140px;
		background-color: var(--ml-calendar-view-menu-bg);
		border: var(--ml-calendar-view-border-width) solid var(--ml-calendar-view-border-color);
		border-radius: var(--ml-radius-md);
		box-shadow: var(--ml-calendar-view-menu-shadow);
		padding: var(--ml-space-1);
		z-index: 10;
	}

	.ml-cv__view-option {
		display: flex;
		align-items: center;
		width: 100%;
		padding: var(--ml-space-2) var(--ml-space-3);
		border: none;
		border-radius: var(--ml-radius-sm);
		background: none;
		font-family: var(--ml-font-sans);
		font-size: var(--ml-text-sm);
		color: var(--ml-calendar-view-title-color);
		cursor: pointer;
		transition: background-color var(--ml-duration-150) var(--ml-ease-in-out);
	}

	.ml-cv__view-option:hover {
		background-color: var(--ml-calendar-view-nav-hover-bg);
	}

	.ml-cv__view-option--active {
		font-weight: var(--ml-font-medium);
		color: var(--ml-calendar-view-menu-active-color);
	}

	.ml-cv__add-btn {
		display: flex;
		align-items: center;
		gap: var(--ml-space-1-5);
		height: 2.25rem;
		padding: 0 var(--ml-space-3);
		border: none;
		border-radius: var(--ml-radius-md);
		background-color: var(--ml-calendar-view-add-bg);
		font-family: var(--ml-font-sans);
		font-size: var(--ml-text-sm);
		font-weight: var(--ml-font-medium);
		color: var(--ml-calendar-view-add-color);
		cursor: pointer;
		transition: background-color var(--ml-duration-150) var(--ml-ease-in-out);
	}

	.ml-cv__add-btn:hover {
		background-color: var(--ml-calendar-view-add-hover-bg);
	}

	.ml-cv__add-btn:focus-visible {
		outline: none;
		box-shadow: var(--ml-calendar-view-focus-ring);
	}

	/* ── Month View ── */
	.ml-cv__month {
		display: flex;
		flex-direction: column;
	}

	.ml-cv__weekday-header {
		display: grid;
		grid-template-columns: repeat(7, minmax(0, 1fr));
		border-bottom: var(--ml-calendar-view-border-width) solid var(--ml-calendar-view-border-color);
	}

	.ml-cv__weekday {
		padding: var(--ml-space-2) var(--ml-space-3);
		font-size: var(--ml-text-xs);
		font-weight: var(--ml-font-medium);
		color: var(--ml-calendar-view-weekday-color);
		text-align: center;
	}

	.ml-cv__weekday--today {
		color: var(--ml-calendar-view-weekday-today-color);
		font-weight: var(--ml-font-semibold);
	}

	.ml-cv__month-grid {
		display: grid;
		grid-template-columns: repeat(7, minmax(0, 1fr));
	}

	.ml-cv__day-cell {
		position: relative;
		min-height: var(--ml-calendar-view-cell-min-height);
		border-right: var(--ml-calendar-view-border-width) solid var(--ml-calendar-view-border-color);
		border-bottom: var(--ml-calendar-view-border-width) solid var(--ml-calendar-view-border-color);
		padding: var(--ml-space-1);
		cursor: pointer;
		transition: background-color var(--ml-duration-150) var(--ml-ease-in-out);
	}

	.ml-cv__day-cell:nth-child(7n) {
		border-right: none;
	}

	.ml-cv__day-cell:hover {
		background-color: var(--ml-calendar-view-cell-hover-bg);
	}

	.ml-cv__day-cell--other-month {
		background-color: var(--ml-calendar-view-cell-other-bg);
	}

	.ml-cv__day-cell--other-month .ml-cv__day-number {
		color: var(--ml-calendar-view-cell-other-color);
	}

	.ml-cv__day-number {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1.75rem;
		height: 1.75rem;
		font-size: var(--ml-text-sm);
		color: var(--ml-calendar-view-title-color);
		margin-bottom: var(--ml-space-0-5);
	}

	.ml-cv__day-number--today {
		background-color: var(--ml-calendar-view-today-bg);
		color: var(--ml-calendar-view-today-color);
		border-radius: var(--ml-radius-full);
		font-weight: var(--ml-font-semibold);
	}

	.ml-cv__day-events {
		display: flex;
		flex-direction: column;
		gap: 1px;
	}

	.ml-cv__event-pill {
		display: flex;
		align-items: center;
		gap: var(--ml-space-1);
		padding: 1px var(--ml-space-1-5);
		border-radius: var(--ml-calendar-view-event-radius);
		border-left: var(--ml-calendar-view-event-border-width) solid;
		font-size: 0.6875rem;
		line-height: 1.45;
		cursor: pointer;
		overflow: hidden;
		white-space: nowrap;
		transition: opacity var(--ml-duration-150) var(--ml-ease-in-out);
	}

	.ml-cv__event-pill:hover {
		opacity: 0.85;
	}

	.ml-cv__event-pill-time {
		flex-shrink: 0;
		font-weight: var(--ml-font-medium);
	}

	.ml-cv__event-pill-title {
		overflow: hidden;
		text-overflow: ellipsis;
	}

	/* Event pill colors */
	.ml-cv__event-pill--gray { background-color: var(--ml-gray-50); border-left-color: var(--ml-gray-400); color: var(--ml-gray-700); }
	.ml-cv__event-pill--blue { background-color: var(--ml-blue-50); border-left-color: var(--ml-blue-500); color: var(--ml-blue-700); }
	.ml-cv__event-pill--purple { background-color: var(--ml-purple-50); border-left-color: var(--ml-purple-500); color: var(--ml-purple-700); }
	.ml-cv__event-pill--green { background-color: var(--ml-green-50); border-left-color: var(--ml-green-500); color: var(--ml-green-700); }
	.ml-cv__event-pill--pink { background-color: var(--ml-red-50); border-left-color: var(--ml-red-400); color: var(--ml-red-700); }
	.ml-cv__event-pill--orange { background-color: var(--ml-amber-50); border-left-color: var(--ml-amber-500); color: var(--ml-amber-700); }
	.ml-cv__event-pill--yellow { background-color: var(--ml-amber-25, var(--ml-amber-50)); border-left-color: var(--ml-amber-400); color: var(--ml-amber-700); }

	.ml-cv__more-link {
		font-size: 0.6875rem;
		font-weight: var(--ml-font-medium);
		color: var(--ml-calendar-view-weekday-color);
		padding: 1px var(--ml-space-1-5);
		cursor: pointer;
		border: none;
		background: none;
		text-align: left;
		font-family: var(--ml-font-sans);
	}

	.ml-cv__more-link:hover {
		color: var(--ml-calendar-view-menu-active-color);
	}

	.ml-cv__day-add {
		position: absolute;
		bottom: var(--ml-space-1);
		right: var(--ml-space-1);
		display: none;
		align-items: center;
		justify-content: center;
		width: 1.25rem;
		height: 1.25rem;
		border: none;
		border-radius: var(--ml-radius-full);
		background-color: var(--ml-calendar-view-add-bg);
		color: var(--ml-calendar-view-add-color);
		font-size: var(--ml-text-sm);
		cursor: pointer;
		line-height: 1;
	}

	.ml-cv__day-cell:hover .ml-cv__day-add {
		display: flex;
	}

	/* ── Time Grid (Week & Day views) — CSS Grid layout ── */
	.ml-cv__time-layout {
		display: flex;
		flex-direction: column;
	}

	.ml-cv__time-header {
		display: grid;
		border-bottom: var(--ml-calendar-view-border-width) solid var(--ml-calendar-view-border-color);
	}

	.ml-cv__time-header--week {
		grid-template-columns: 60px repeat(7, 1fr);
	}

	.ml-cv__time-header--day {
		grid-template-columns: 60px 1fr;
	}

	.ml-cv__time-header-gutter {
		border-right: var(--ml-calendar-view-border-width) solid var(--ml-calendar-view-border-color);
	}

	.ml-cv__time-header-day {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: var(--ml-space-2) 0;
		border-right: var(--ml-calendar-view-border-width) solid var(--ml-calendar-view-border-color);
	}

	.ml-cv__time-header-day:last-child {
		border-right: none;
	}

	.ml-cv__time-header-label {
		font-size: var(--ml-text-xs);
		font-weight: var(--ml-font-medium);
		color: var(--ml-calendar-view-weekday-color);
	}

	.ml-cv__time-header-number {
		font-size: var(--ml-text-lg);
		font-weight: var(--ml-font-semibold);
		color: var(--ml-calendar-view-title-color);
		width: 2rem;
		height: 2rem;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.ml-cv__time-header-day--today .ml-cv__time-header-label {
		color: var(--ml-calendar-view-weekday-today-color);
	}

	.ml-cv__time-header-day--today .ml-cv__time-header-number {
		background-color: var(--ml-calendar-view-today-bg);
		color: var(--ml-calendar-view-today-color);
		border-radius: var(--ml-radius-full);
	}

	.ml-cv__time-scroll {
		overflow-y: auto;
		max-height: 720px;
	}

	/* CSS Grid body: columns + rows for time grid */
	.ml-cv__time-body {
		display: grid;
		grid-template-rows: repeat(var(--cv-rows), 40px);
	}

	.ml-cv__time-body--week {
		grid-template-columns: 60px repeat(7, 1fr);
	}

	.ml-cv__time-body--day {
		grid-template-columns: 60px 1fr;
	}

	.ml-cv__time-gutter {
		border-right: var(--ml-calendar-view-border-width) solid var(--ml-calendar-view-border-color);
	}

	.ml-cv__time-column {
		border-right: var(--ml-calendar-view-border-width) solid var(--ml-calendar-view-border-color);
	}

	.ml-cv__time-column--last {
		border-right: none;
	}

	.ml-cv__time-row {
		border-bottom: var(--ml-calendar-view-border-width) solid var(--ml-calendar-view-border-color);
		pointer-events: none;
	}

	.ml-cv__time-label {
		display: flex;
		align-items: flex-start;
		justify-content: flex-end;
		padding: var(--ml-space-1) var(--ml-space-2) 0;
		font-size: 0.625rem;
		color: var(--ml-calendar-view-weekday-color);
		white-space: nowrap;
		pointer-events: none;
	}

	/* Events placed via grid-row on the CSS grid */
	.ml-cv__time-event {
		box-sizing: border-box;
		min-width: 0;
		min-height: 0;
		border-radius: var(--ml-calendar-view-event-radius);
		border-left: var(--ml-calendar-view-event-border-width) solid;
		padding: var(--ml-space-1) var(--ml-space-1-5);
		font-size: 0.6875rem;
		overflow: hidden;
		cursor: pointer;
		z-index: 1;
		transition: opacity var(--ml-duration-150) var(--ml-ease-in-out);
	}

	.ml-cv__time-event:hover {
		opacity: 0.85;
	}

	.ml-cv__time-event-title {
		font-weight: var(--ml-font-medium);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.ml-cv__time-event-time {
		font-size: 0.625rem;
		opacity: 0.8;
	}

	/* Time event colors */
	.ml-cv__time-event--gray { background-color: var(--ml-gray-50); border-left-color: var(--ml-gray-400); color: var(--ml-gray-700); }
	.ml-cv__time-event--blue { background-color: var(--ml-blue-50); border-left-color: var(--ml-blue-500); color: var(--ml-blue-700); }
	.ml-cv__time-event--purple { background-color: var(--ml-purple-50); border-left-color: var(--ml-purple-500); color: var(--ml-purple-700); }
	.ml-cv__time-event--green { background-color: var(--ml-green-50); border-left-color: var(--ml-green-500); color: var(--ml-green-700); }
	.ml-cv__time-event--pink { background-color: var(--ml-red-50); border-left-color: var(--ml-red-400); color: var(--ml-red-700); }
	.ml-cv__time-event--orange { background-color: var(--ml-amber-50); border-left-color: var(--ml-amber-500); color: var(--ml-amber-700); }
	.ml-cv__time-event--yellow { background-color: var(--ml-amber-25, var(--ml-amber-50)); border-left-color: var(--ml-amber-400); color: var(--ml-amber-700); }

	/* ── Day View with sidebar ── */
	.ml-cv__day-layout {
		display: grid;
		grid-template-columns: 1fr 280px;
	}

	.ml-cv__day-main {
		overflow: hidden;
	}

	.ml-cv__day-sidebar {
		border-left: var(--ml-calendar-view-border-width) solid var(--ml-calendar-view-border-color);
		padding: var(--ml-space-4);
		overflow-y: auto;
		max-height: 780px;
	}

	/* Mini calendar in sidebar */
	.ml-cv__mini-cal {
		margin-bottom: var(--ml-space-4);
	}

	.ml-cv__mini-cal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: var(--ml-space-2);
	}

	.ml-cv__mini-cal-title {
		font-size: var(--ml-text-sm);
		font-weight: var(--ml-font-semibold);
		color: var(--ml-calendar-view-title-color);
	}

	.ml-cv__mini-cal-nav {
		display: flex;
		align-items: center;
		gap: 0;
	}

	.ml-cv__mini-cal-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1.5rem;
		height: 1.5rem;
		border: none;
		border-radius: var(--ml-radius-sm);
		background: none;
		color: var(--ml-calendar-view-nav-color);
		cursor: pointer;
	}

	.ml-cv__mini-cal-btn:hover {
		background-color: var(--ml-calendar-view-nav-hover-bg);
		color: var(--ml-calendar-view-nav-hover-color);
	}

	.ml-cv__mini-cal-weekdays {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		margin-bottom: var(--ml-space-1);
	}

	.ml-cv__mini-cal-weekday {
		font-size: 0.625rem;
		font-weight: var(--ml-font-medium);
		color: var(--ml-calendar-view-weekday-color);
		text-align: center;
		padding: var(--ml-space-0-5) 0;
	}

	.ml-cv__mini-cal-grid {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
	}

	.ml-cv__mini-cal-day {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		aspect-ratio: 1;
		border: none;
		border-radius: var(--ml-radius-full);
		background: none;
		font-size: 0.6875rem;
		color: var(--ml-calendar-view-title-color);
		cursor: pointer;
		padding: 0;
		gap: 1px;
	}

	.ml-cv__mini-cal-day:hover {
		background-color: var(--ml-calendar-view-nav-hover-bg);
	}

	.ml-cv__mini-cal-day--other {
		color: var(--ml-calendar-view-cell-other-color);
	}

	.ml-cv__mini-cal-day--today {
		font-weight: var(--ml-font-semibold);
	}

	.ml-cv__mini-cal-day--selected {
		background-color: var(--ml-calendar-view-mini-selected-bg);
		color: var(--ml-calendar-view-mini-selected-color);
		font-weight: var(--ml-font-semibold);
	}

	.ml-cv__mini-cal-day--selected:hover {
		background-color: var(--ml-calendar-view-mini-selected-hover-bg);
	}

	.ml-cv__mini-cal-dot {
		width: 3px;
		height: 3px;
		border-radius: var(--ml-radius-full);
		background-color: var(--ml-calendar-view-mini-dot-color);
	}

	.ml-cv__mini-cal-day--selected .ml-cv__mini-cal-dot {
		background-color: var(--ml-calendar-view-mini-selected-color);
	}

	/* Sidebar event list */
	.ml-cv__sidebar-title {
		font-size: var(--ml-text-sm);
		font-weight: var(--ml-font-semibold);
		color: var(--ml-calendar-view-title-color);
		margin-bottom: var(--ml-space-3);
	}

	.ml-cv__sidebar-events {
		display: flex;
		flex-direction: column;
		gap: var(--ml-space-2);
	}

	.ml-cv__sidebar-event {
		display: flex;
		gap: var(--ml-space-2);
		padding: var(--ml-space-2);
		border-radius: var(--ml-radius-md);
		cursor: pointer;
		transition: background-color var(--ml-duration-150) var(--ml-ease-in-out);
	}

	.ml-cv__sidebar-event:hover {
		background-color: var(--ml-calendar-view-sidebar-event-hover-bg);
	}

	.ml-cv__sidebar-event-bar {
		width: 3px;
		border-radius: var(--ml-radius-full);
		flex-shrink: 0;
	}

	.ml-cv__sidebar-event-bar--gray { background-color: var(--ml-gray-400); }
	.ml-cv__sidebar-event-bar--blue { background-color: var(--ml-blue-500); }
	.ml-cv__sidebar-event-bar--purple { background-color: var(--ml-purple-500); }
	.ml-cv__sidebar-event-bar--green { background-color: var(--ml-green-500); }
	.ml-cv__sidebar-event-bar--pink { background-color: var(--ml-red-400); }
	.ml-cv__sidebar-event-bar--orange { background-color: var(--ml-amber-500); }
	.ml-cv__sidebar-event-bar--yellow { background-color: var(--ml-amber-400); }

	.ml-cv__sidebar-event-content {
		flex: 1;
		min-width: 0;
	}

	.ml-cv__sidebar-event-title {
		font-size: var(--ml-text-sm);
		font-weight: var(--ml-font-medium);
		color: var(--ml-calendar-view-title-color);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.ml-cv__sidebar-event-time {
		font-size: var(--ml-text-xs);
		color: var(--ml-calendar-view-weekday-color);
	}

	.ml-cv__sidebar-empty {
		font-size: var(--ml-text-sm);
		color: var(--ml-calendar-view-weekday-color);
		text-align: center;
		padding: var(--ml-space-6) 0;
	}
`;
