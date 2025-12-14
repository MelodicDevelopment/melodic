import type { ITemplatePart } from './itemplate-part.interface';

export interface ITemplateCache {
	element: HTMLTemplateElement;
	parts: ITemplatePart[];
}
