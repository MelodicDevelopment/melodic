import { signal } from '../../signals';
import type { State } from '../types/state.type';

export const createState = <S>(initState: S): State<S> => {
	const state: State<S> = {} as State<S>;

	Object.keys(initState as object).forEach((key) => {
		state[key as keyof S] = signal(initState[key as keyof S]);
	});

	return state;
};
