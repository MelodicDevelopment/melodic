import { signal, type Signal } from '../../signals';
import type { ActionPayload, EmptyActionPayload } from '../types/action-payload.type';
import type { Action, TypedAction } from '../types/action.type';
import type { Store } from './store.class';

export abstract class GlobalStore {
	private _stores: { [key: string]: Store<any> } = {};
	private _globalState: Signal<{ [key: string]: any }> = signal({});

	public get actions(): Action[] {
		return Object.values(this._stores).flatMap((store) => store.actions);
	}

	protected registerStore<K extends string, S extends object>(key: K, store: Store<S>): void {
		this._stores[key] = store;
		this._globalState.update((state) => ({ ...state, [key]: store.select((s) => s)() }));
	}

	protected getStore<K extends string, S extends object>(key: K): Store<S> {
		return this._stores[key] as Store<S>;
	}

	protected dispatch<T extends string, P extends ActionPayload = EmptyActionPayload>(action: TypedAction<T, P>, payload?: P, storeKey?: string): void {
		if (storeKey) {
			const store = this._stores[storeKey];
			if (store) {
				store.dispatch(action, payload);
			}
		} else {
			Object.values(this._stores).forEach((store) => {
				store.dispatch(action, payload);
			});
		}
	}
}
