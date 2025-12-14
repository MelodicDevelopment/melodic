import type { TemplateResult } from '../../template/template-result.class';

export type ComponentMeta = {
	selector: string;
	template?: (component: any, attributes?: Record<string, string>) => TemplateResult;
	styles?: () => TemplateResult;
	attributes?: string[];
};

export type TypedComponentMeta<Component> = Omit<ComponentMeta, 'template'> & {
	template?: (component: Component, attributes?: Record<string, string>) => TemplateResult;
};
