export interface IInjectionToken<T> {
	readonly __brand: T;
	readonly description: string;
}
