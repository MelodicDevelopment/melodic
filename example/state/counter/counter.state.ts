export interface CounterState {
	count: number;
	lastAction: string | null;
}

export const initialCounterState: CounterState = {
	count: 0,
	lastAction: null
};
