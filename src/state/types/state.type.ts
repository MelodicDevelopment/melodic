import type { Signal } from '../../signals';

export type State<S> = {
	[K in keyof S]: Signal<S[K]>;
};
