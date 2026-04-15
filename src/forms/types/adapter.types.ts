export type FormControlAdapter<T = unknown> = {
	readonly inputEvent: string;
	readonly blurEvent: string;
	getValue(element: Element): T;
	setValue(element: Element, value: T): void;
	setDisabled?(element: Element, disabled: boolean): void;
};

export type AdapterPredicate = (element: Element) => boolean;
