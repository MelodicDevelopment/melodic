import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { announce, createLiveRegion } from '../../src/utils/accessibility/live-region';

function politeRegion(): HTMLElement | null {
	return document.getElementById('ml-live-region');
}

function assertiveRegion(): HTMLElement | null {
	return document.getElementById('ml-live-region-assertive');
}

describe('announce', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(async () => {
		// Drain any queued announcements so state doesn't leak between tests
		await vi.runAllTimersAsync();
		vi.useRealTimers();
		politeRegion()?.remove();
		assertiveRegion()?.remove();
	});

	it('announces a single message after the clear delay', async () => {
		announce('Saved');
		const region = politeRegion()!;
		expect(region).toBeTruthy();
		expect(region.getAttribute('aria-live')).toBe('polite');
		expect(region.textContent).toBe('');

		await vi.advanceTimersByTimeAsync(60);
		expect(region.textContent).toBe('Saved');
	});

	it('queues rapid successive messages so none are lost', async () => {
		const seen: string[] = [];
		announce('First');
		announce('Second');
		announce('Third');

		const region = politeRegion()!;
		const observer = () => {
			if (region.textContent) seen.push(region.textContent);
		};

		// Sample after each queue step: 50ms set + 150ms gap per message
		for (let i = 0; i < 3; i++) {
			await vi.advanceTimersByTimeAsync(60);
			observer();
			await vi.advanceTimersByTimeAsync(160);
		}

		expect(seen).toEqual(['First', 'Second', 'Third']);
	});

	it('announces identical consecutive messages (clear/set cycle)', async () => {
		announce('Ping');
		announce('Ping');

		const region = politeRegion()!;
		await vi.advanceTimersByTimeAsync(60);
		expect(region.textContent).toBe('Ping');

		// Region is cleared before the second identical message is set again
		await vi.advanceTimersByTimeAsync(150);
		expect(region.textContent).toBe('');
		await vi.advanceTimersByTimeAsync(60);
		expect(region.textContent).toBe('Ping');
	});

	it('uses separate regions per politeness level so they cannot clobber each other', async () => {
		announce('Background info', 'polite');
		announce('Error!', 'assertive');

		await vi.advanceTimersByTimeAsync(60);

		expect(politeRegion()!.textContent).toBe('Background info');
		expect(assertiveRegion()!.textContent).toBe('Error!');
		expect(politeRegion()!.getAttribute('aria-live')).toBe('polite');
		expect(assertiveRegion()!.getAttribute('aria-live')).toBe('assertive');
		expect(assertiveRegion()!.getAttribute('role')).toBe('alert');
	});

	it('keeps queueing per level independently', async () => {
		announce('P1', 'polite');
		announce('A1', 'assertive');
		announce('P2', 'polite');

		await vi.advanceTimersByTimeAsync(60);
		expect(politeRegion()!.textContent).toBe('P1');
		expect(assertiveRegion()!.textContent).toBe('A1');

		await vi.advanceTimersByTimeAsync(210);
		expect(politeRegion()!.textContent).toBe('P2');
	});

	it('recreates the region if it was removed from the DOM', async () => {
		announce('One');
		await vi.runAllTimersAsync();
		politeRegion()!.remove();

		announce('Two');
		await vi.advanceTimersByTimeAsync(60);
		expect(politeRegion()).toBeTruthy();
		expect(politeRegion()!.textContent).toBe('Two');
	});
});

describe('createLiveRegion', () => {
	it('creates a detached region with the requested options', () => {
		const region = createLiveRegion({ id: 'custom-region', priority: 'assertive', atomic: false });
		expect(region.id).toBe('custom-region');
		expect(region.getAttribute('aria-live')).toBe('assertive');
		expect(region.getAttribute('aria-atomic')).toBe('false');
		expect(region.getAttribute('role')).toBe('status');
		expect(region.isConnected).toBe(false);
	});
});
