export interface OnInit {
	onInit: () => void;
}

export interface OnCreate {
	onCreate: () => void;
}

export interface OnRender {
	onRender: () => void;
}

export interface OnDestroy {
	onDestroy: () => void;
}

export interface OnAttributeChange {
	onAttributeChange: (attribute: string, oldVal: unknown, newVal: unknown) => void;
}

export interface OnPropertyChange {
	onPropertyChange: (property: string, oldVal: unknown, newVal: unknown) => void;
}

export interface IComponent
	extends Partial<OnInit>,
		Partial<OnCreate>,
		Partial<OnRender>,
		Partial<OnDestroy>,
		Partial<OnAttributeChange>,
		Partial<OnPropertyChange> {}
