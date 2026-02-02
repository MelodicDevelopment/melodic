import type { UniqueID } from '../../../functions';

export class DialogRef<T = unknown> {
	private readonly _afterOpened: Promise<void>;
	private _resolvedOpened!: () => void;
	private readonly _afterClosed: Promise<T | undefined>;
	private _resolvedClosed!: (result: T | undefined) => void;

	constructor(public readonly dialogID: UniqueID) {
		this._afterOpened = new Promise<void>((resolve) => {
			this._resolvedOpened = resolve;
		});

		this._afterClosed = new Promise<T | undefined>((resolve) => {
			this._resolvedClosed = resolve;
		});
	}

	open(): void {
		this._resolvedOpened();
	}

	close(result?: T): void {
		this._resolvedClosed(result);
	}

	afterOpened(): Promise<void> {
		return this._afterOpened;
	}

	afterClosed(): Promise<T | undefined> {
		return this._afterClosed;
	}
}
