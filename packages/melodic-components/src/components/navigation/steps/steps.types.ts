export type StepsVariant = 'numbered' | 'circles' | 'icons' | 'bar';
export type StepsOrientation = 'horizontal' | 'vertical';
export type StepsConnector = 'solid' | 'dotted';
export type StepsColor = 'primary' | 'success';
export type StepStatus = 'completed' | 'current' | 'upcoming';

export interface StepConfig {
	value: string;
	label: string;
	description?: string;
	icon?: string;
	disabled?: boolean;
	href?: string;
}
