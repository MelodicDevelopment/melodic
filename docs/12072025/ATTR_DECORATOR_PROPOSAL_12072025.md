# @Attr() Decorator Proposal

This document outlines a decorator-based approach for syncing HTML attributes with component properties.

## The Decorator

```typescript
// src/decorators/attr.decorator.ts

const ATTR_METADATA_KEY = Symbol('attr');

export interface AttrOptions {
    /** Attribute name if different from property name */
    name?: string;
    /** Transform function when reading from attribute */
    transform?: (value: string | null) => unknown;
}

/**
 * Marks a property as synced with an HTML attribute.
 * The property will automatically update when the attribute changes.
 */
export function Attr(options?: AttrOptions | string): PropertyDecorator {
    return function (target: object, propertyKey: string | symbol): void {
        const attrName = typeof options === 'string'
            ? options
            : options?.name ?? String(propertyKey);

        const transform = typeof options === 'object' ? options.transform : undefined;

        // Store metadata about which properties are attributes
        const existing: Map<string, AttrOptions & { propertyKey: string }> =
            Reflect.getMetadata(ATTR_METADATA_KEY, target.constructor) ?? new Map();

        existing.set(attrName, {
            ...typeof options === 'object' ? options : {},
            name: attrName,
            propertyKey: String(propertyKey),
            transform
        });

        Reflect.defineMetadata(ATTR_METADATA_KEY, existing, target.constructor);
    };
}

/** Get all @Attr() metadata for a component class */
export function getAttrMetadata(target: object): Map<string, AttrOptions & { propertyKey: string }> {
    return Reflect.getMetadata(ATTR_METADATA_KEY, target.constructor) ?? new Map();
}
```

## Usage in Components

```typescript
@MelodicComponent({
    selector: 'test-component',
    template: (self: TestComponent) => html`
        <p>Label: ${self.label}</p>
        <p>Count: ${self.maxCount}</p>
        <p>Disabled: ${self.disabled}</p>
    `
})
export class TestComponent {
    @Attr() label = 'Default Label';

    @Attr('max-count')  // Different attribute name (kebab-case in HTML)
    maxCount = 10;

    @Attr({ transform: (v) => v !== null })  // Boolean attribute
    disabled = false;
}
```

HTML usage:
```html
<test-component
    label="Hello World"
    max-count="25"
    disabled
></test-component>
```

## ComponentBase Integration

```typescript
import { getAttrMetadata } from '../decorators/attr.decorator';

export abstract class ComponentBase extends HTMLElement {
    // ... existing code ...

    private setupAttrBindings(): void {
        const attrMeta = getAttrMetadata(this._component);

        for (const [attrName, meta] of attrMeta) {
            // Set initial value from attribute if present
            const attrValue = this.getAttribute(attrName);
            if (attrValue !== null) {
                const value = meta.transform ? meta.transform(attrValue) : attrValue;
                (this._component as any)[meta.propertyKey] = value;
            }
        }
    }

    attributeChangedCallback(attribute: string, oldVal: string | null, newVal: string | null): void {
        const attrMeta = getAttrMetadata(this._component);
        const meta = attrMeta.get(attribute);

        if (meta) {
            const value = meta.transform ? meta.transform(newVal) : newVal;
            (this._component as any)[meta.propertyKey] = value;
        }

        this.render();

        if (this._component.onAttributeChange !== undefined) {
            this._component.onAttributeChange(attribute, oldVal, newVal);
        }
    }
}
```

## MelodicComponent Decorator Integration

The tricky part is `observedAttributes` - it's a static property needed before any instance exists. The `@MelodicComponent` decorator needs to read the `@Attr()` metadata and set it automatically:

```typescript
// In melodic-component.decorator.ts

import { getAttrMetadata, ATTR_METADATA_KEY } from '../decorators/attr.decorator';

export function MelodicComponent<C extends Component>(meta: TypedComponentMeta<C>) {
    return function (component: INewable<C>): void {
        if (customElements.get(meta.selector) === undefined) {
            // Get @Attr() metadata from the component class
            const attrMeta: Map<string, any> =
                Reflect.getMetadata(ATTR_METADATA_KEY, component) ?? new Map();

            // Merge with manually specified attributes
            const observedAttrs = [
                ...attrMeta.keys(),
                ...(meta.attributes ?? [])
            ];

            const webComponent = class extends ComponentBase {
                constructor() {
                    // ... existing constructor code ...
                    super(meta, Reflect.construct(component, dependencies));
                    this.setupAttrBindings(); // New: sync initial attribute values
                }

                static observedAttributes = observedAttrs;
            };

            customElements.define(meta.selector, webComponent);
        }
    };
}
```

## Common Transform Functions

You might want to provide built-in transforms for common cases:

```typescript
// src/decorators/transforms.ts

/** Parse attribute as number */
export const asNumber = (v: string | null): number =>
    v === null ? 0 : Number(v);

/** Parse attribute as boolean (presence = true) */
export const asBoolean = (v: string | null): boolean =>
    v !== null;

/** Parse attribute as JSON */
export const asJSON = <T>(v: string | null): T | null =>
    v === null ? null : JSON.parse(v);
```

Usage:
```typescript
@Attr({ transform: asNumber })
maxCount = 10;

@Attr({ transform: asBoolean })
disabled = false;
```

## Key Considerations

1. **Reflect Metadata**: Requires `reflect-metadata` polyfill and `emitDecoratorMetadata: true` in tsconfig.

2. **Timing**: `setupAttrBindings()` must be called after the component instance is created but before `onInit()`.

3. **Two-way sync**: This proposal only handles attribute → property. If you also want property → attribute sync, the `observe()` method would need to call `this.setAttribute()` when tracked properties change.

4. **Type safety**: The transform function allows converting string attributes to proper types (numbers, booleans, objects).

5. **No `attributes` array needed**: With `@Attr()`, you no longer need to manually specify `attributes: ['label']` in the decorator metadata - it's inferred from the decorators.
