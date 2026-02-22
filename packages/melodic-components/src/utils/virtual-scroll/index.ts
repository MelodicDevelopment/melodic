export interface VirtualScrollOptions {
	/** Returns the height of a single row in pixels (function because it can change with size variants) */
	rowHeight: () => number;
	/** Returns the total number of items (function because data can change) */
	itemCount: () => number;
	/** Called whenever the visible range changes */
	onUpdate: (startIndex: number, endIndex: number) => void;
	/** When returns false, shows all rows (default: always enabled) */
	enabled?: () => boolean;
	/** Overscan rows above/below visible area (default: 3) */
	buffer?: number;
}

export class VirtualScroller {
	private _viewport: HTMLElement | null = null;
	private _resizeObserver: ResizeObserver | null = null;
	private _options: VirtualScrollOptions | null = null;

	/** Attach to a scrollable viewport element and begin observing */
	attach(viewport: HTMLElement, options: VirtualScrollOptions): void {
		this._viewport = viewport;
		this._options = options;

		this._resizeObserver = new ResizeObserver(entries => {
			for (const entry of entries) {
				this._compute(entry.contentRect.height);
			}
		});
		this._resizeObserver.observe(viewport);
		viewport.addEventListener('scroll', this._handleScroll);
	}

	/** Tear down observers and event listeners */
	detach(): void {
		this._resizeObserver?.disconnect();
		this._resizeObserver = null;
		if (this._viewport) {
			this._viewport.removeEventListener('scroll', this._handleScroll);
		}
		this._viewport = null;
		this._options = null;
	}

	/** Call after item count or row height changes (e.g. after sort/filter/page change) */
	invalidate(): void {
		if (!this._viewport) return;
		this._compute(this._viewport.clientHeight);
	}

	private _handleScroll = (): void => {
		this._compute(this._viewport!.clientHeight);
	};

	private _compute(viewportHeight: number): void {
		if (!this._viewport || !this._options) return;
		const { rowHeight, itemCount, onUpdate, enabled, buffer = 3 } = this._options;

		const count = itemCount();

		if (enabled && !enabled()) {
			onUpdate(0, count);
			return;
		}

		const scrollTop = this._viewport.scrollTop;
		const rowH = rowHeight();
		const newStart = Math.max(0, Math.floor(scrollTop / rowH) - buffer);
		const newEnd = Math.min(count, Math.ceil((scrollTop + viewportHeight) / rowH) + buffer);
		onUpdate(newStart, newEnd);
	}
}
