export type Side = 'top' | 'right' | 'bottom' | 'left';
export type Alignment = 'start' | 'center' | 'end';

export type Placement =
	| 'top'
	| 'top-start'
	| 'top-end'
	| 'bottom'
	| 'bottom-start'
	| 'bottom-end'
	| 'left'
	| 'left-start'
	| 'left-end'
	| 'right'
	| 'right-start'
	| 'right-end';

export interface Position {
	x: number;
	y: number;
}

export interface Rects {
	reference: DOMRect;
	floating: DOMRect;
}

export interface Elements {
	reference: Element;
	floating: HTMLElement;
}

export interface MiddlewareState {
	x: number;
	y: number;
	placement: Placement;
	rects: Rects;
	elements: Elements;
	middlewareData: Record<string, unknown>;
}

export interface Middleware {
	name: string;
	fn: (state: MiddlewareState) => Partial<MiddlewareState> | void;
}

export interface ComputePositionConfig {
	placement?: Placement;
	middleware?: Middleware[];
}

export interface ComputePositionReturn extends Position {
	placement: Placement;
	middlewareData: Record<string, unknown>;
}
