import type { TypedAction } from '../types/action.type';
import { signal, type Signal } from '../../signals';
import type { Reducer } from '../types/reducer.type';
import type { ActionPayload, EmptyActionPayload } from '../types/action-payload.type';

export abstract class Store<S extends object> {
	private _state: Signal<S>;

	private _actions: {
		[key: string]: Reducer<S>;
	} = {};

	public resetState = this.addAction<'RESET_STATE'>('RESET_STATE', () => ({ ...this._initialState }));

	constructor(private _initialState: S) {
		this._state = signal(_initialState);
	}

	public get state(): Signal<S> {
		return this._state;
	}

	protected addAction<T extends string, P extends ActionPayload = EmptyActionPayload>(type: T, reducer: (state: S, payload?: P) => S): TypedAction<T, P> {
		this._actions[type] = reducer as (state: S, payload?: unknown) => S;

		const actionRef: TypedAction<T, P> = {
			type: type,
			payload: {} as P
		};

		return actionRef;
	}

	// public dispatch<P>(type: string, payload?: P): void {

	// }
}
