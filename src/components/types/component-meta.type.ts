import type { TemplateResult } from '../../template/classes/template-result.class';

/** Coercion type for an observed attribute. */
export type AttributeType = 'boolean' | 'number' | 'string';

/**
 * Observed attributes, either as a plain list (types are inferred from each
 * property's initial value) or as a map that declares the type explicitly:
 *
 * ```typescript
 * attributes: ['label', 'count']
 * attributes: { open: 'boolean', offset: 'number', label: 'string' }
 * ```
 *
 * The map form is what `static propertyTypes` used to be for, and it is the
 * only way to type a property with no initializer (`open?: boolean`), whose
 * type cannot be inferred.
 */
export type ComponentAttributes = string[] | Record<string, AttributeType>;

export type ComponentMeta = {
	selector: string;
	template?: (component: any, attributes?: Record<string, string>) => TemplateResult;
	styles?: () => TemplateResult;
	attributes?: ComponentAttributes;
};

export type TypedComponentMeta<Component> = Omit<ComponentMeta, 'template'> & {
	template?: (component: Component, attributes?: Record<string, string>) => TemplateResult;
};

/** Normalize either `attributes` form to the observed-attribute name list. */
export function attributeNames(attributes: ComponentAttributes | undefined): string[] {
	if (!attributes) {
		return [];
	}

	return Array.isArray(attributes) ? attributes : Object.keys(attributes);
}

/** Normalize either `attributes` form to the declared coercion types. */
export function attributeTypes(attributes: ComponentAttributes | undefined): Record<string, AttributeType> {
	if (!attributes || Array.isArray(attributes)) {
		return {};
	}

	return attributes;
}
