# Component System

The Melodic component system provides a decorator-based approach for creating web components with Shadow DOM encapsulation, reactive properties, and lifecycle hooks.

## Table of Contents

- [Overview](#overview)
- [Creating a Component](#creating-a-component)
- [The @MelodicComponent Decorator](#the-melodiccomponent-decorator)
- [Component Metadata](#component-metadata)
- [Lifecycle Hooks](#lifecycle-hooks)
- [Property Reactivity](#property-reactivity)
- [Accessing the Host Element](#accessing-the-host-element)
- [Attributes](#attributes)
- [Complete Example](#complete-example)
- [Content Projection (Slots)](#content-projection-slots)

## Overview

Melodic components are standard Web Components built using:

- **TypeScript decorators** for component registration
- **Shadow DOM** for style and DOM encapsulation
- **Reactive properties** that automatically trigger re-renders
- **Template functions** using tagged template literals

## Creating a Component

A basic component consists of a class decorated with `@MelodicComponent`:

```typescript
import { MelodicComponent, html, css } from '@melodicdev/core';

@MelodicComponent({
    selector: 'my-greeting',
    template: (self: MyGreeting) => html`
        <h1>Hello, ${self.name}!</h1>
    `,
    styles: () => css`
        h1 {
            color: blue;
        }
    `
})
export class MyGreeting {
    name = 'World';
}
```

Usage in HTML:
```html
<my-greeting></my-greeting>
```

## The @MelodicComponent Decorator

```typescript
import { MelodicComponent } from '@melodicdev/core';
```

The `@MelodicComponent` decorator transforms a plain class into a custom element. It:

1. Creates a custom element class extending `HTMLElement`
2. Registers it with the browser via `customElements.define()`
3. Sets up Shadow DOM with the provided template and styles
4. Makes component properties reactive
5. Handles dependency injection for constructor parameters

### Signature

```typescript
function MelodicComponent<C extends Component>(
    meta: TypedComponentMeta<C>
): (component: INewable<C>) => void
```

## Component Metadata

The decorator accepts a metadata object with the following properties:

### `selector` (required)

```typescript
selector: string
```

The custom element tag name. Must contain a hyphen per Web Components spec.

```typescript
@MelodicComponent({
    selector: 'user-profile',  // Used as <user-profile></user-profile>
    // ...
})
```

### `template` (optional)

```typescript
template?: (component: T, attributes?: Record<string, string>) => TemplateResult
```

A function that receives the component instance and returns a `TemplateResult` (created via the `html` tagged template).

```typescript
@MelodicComponent({
    selector: 'my-component',
    template: (self: MyComponent, attrs) => html`
        <div>
            <p>Name: ${self.name}</p>
            <p>ID Attribute: ${attrs?.id}</p>
        </div>
    `
})
```

**Parameters:**
- `component` - The component instance with all its properties and methods
- `attributes` - Optional object containing all HTML attributes on the element

### `styles` (optional)

```typescript
styles?: () => TemplateResult
```

A function that returns CSS styles using the `css` tagged template.

```typescript
@MelodicComponent({
    selector: 'styled-button',
    styles: () => css`
        :host {
            display: inline-block;
        }
        button {
            padding: 8px 16px;
            border-radius: 4px;
            background: #007bff;
            color: white;
            border: none;
            cursor: pointer;
        }
        button:hover {
            background: #0056b3;
        }
    `
})
```

**Note:** Use `:host` to style the custom element itself.

### Global Styles (optional)

Melodic can copy a shared stylesheet into every component root. Add a `<style>` or `<link>` tag with the `melodic-styles` attribute in your HTML, and all components will inherit those rules.

```html
<style melodic-styles>
	a { color: #1a64ff; text-decoration: none; }
	a:hover { text-decoration: underline; }
</style>
```

```html
<link rel="stylesheet" href="/styles/global.css" melodic-styles />
```

Melodic uses a single shared `CSSStyleSheet` when supported (memory efficient), and falls back to cloning a `<style>` tag per component when not.

You can also register global styles from JavaScript. This is useful when bundlers rewrite `<link>` tags and you want to keep the styles separate.

```typescript
import globalStyles from './styles/global.css?inline';
import { registerGlobalStyles } from '@melodicdev/core';

registerGlobalStyles(globalStyles);
```

Notes:
- A `<link>` tag should point at a file served from `public/` (for example `/styles/global.css` maps to `public/styles/global.css`).
- The `?inline` import keeps the CSS in your module graph and avoids bundling it into other CSS files.
- Call `registerGlobalStyles` before creating components so the shared sheet is ready for adoption.
- If you never call `setGlobalStylesAttribute`, Melodic uses the default `melodic-styles` attribute.

If you want a different attribute name, configure it before any components are created:

```typescript
import { setGlobalStylesAttribute } from '@melodicdev/core';

setGlobalStylesAttribute('my-global-styles');
```

#### Vite plugin (optional)

If you prefer to keep a `<link>` tag and still minify the file in build output, you can use a Vite plugin that preserves `melodic-styles` links. The example app uses `vite-plugin-melodic-styles.ts` at the repository root.

Add the plugin to your project and wire it in:

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import { melodicStylesPlugin } from './vite-plugin-melodic-styles';
import { melodicStylesAttribute } from './melodic-styles.config';

export default defineConfig({
	plugins: [melodicStylesPlugin({ attribute: melodicStylesAttribute })]
});
```

Then include the link in HTML and keep the file in `public/`:

```html
<link rel="stylesheet" href="/styles/global.css" melodic-styles />
```

```
public/
	styles/
		global.css
```

For projects that want one shared source of truth, export the attribute from a local config file and reuse it in both runtime code and Vite:

```ts
// melodic-styles.config.ts
export const melodicStylesAttribute = 'melodic-styles';
```

```ts
// src/main.ts
import { setGlobalStylesAttribute } from '@melodicdev/core';
import { melodicStylesAttribute } from '../melodic-styles.config';

setGlobalStylesAttribute(melodicStylesAttribute);
```

## Separating Templates and Styles

When templates or styles grow beyond a few lines, it is recommended to move them into dedicated files for clarity and reuse.

```typescript
// user-profile.template.ts
import { html } from '@melodicdev/core';
import type { UserProfileComponent } from './user-profile.component';

export const userProfileTemplate = (self: UserProfileComponent) => html`
	<section>
		<h2>${self.name}</h2>
		<p>${self.role}</p>
	</section>
`;
```

```typescript
// user-profile.styles.ts
import { css } from '@melodicdev/core';

export const userProfileStyles = () => css`
	:host {
		display: block;
	}
`;
```

```typescript
// user-profile.component.ts
import { MelodicComponent } from '@melodicdev/core';
import { userProfileTemplate } from './user-profile.template';
import { userProfileStyles } from './user-profile.styles';

@MelodicComponent({
	selector: 'user-profile',
	template: userProfileTemplate,
	styles: userProfileStyles
})
export class UserProfileComponent {
	name = 'Ada Lovelace';
	role = 'Engineer';
}
```

### `attributes` (optional)

```typescript
attributes?: string[]
```

List of HTML attributes to observe. When these attributes change, `attributeChangedCallback` fires and the component re-renders.

```typescript
@MelodicComponent({
    selector: 'user-card',
    attributes: ['user-id', 'theme'],
    template: (self: UserCard) => html`
        <div>User ID: ${self.userId}</div>
    `
})
export class UserCard {
    userId = '';  // Will sync with 'user-id' attribute
    theme = 'light';
}
```

## Lifecycle Hooks

Components can implement lifecycle hooks by defining methods with specific names. All hooks are optional.

### `onInit()`

```typescript
onInit?: () => void
```

Called after property observation is set up, but **before** the component is attached to the DOM.

```typescript
export class MyComponent {
    onInit() {
        console.log('Component initialized');
        // Good for: initial data fetching, setting up subscriptions
    }
}
```

### `onCreate()`

```typescript
onCreate?: () => void
```

Called after the component is attached to the DOM (`connectedCallback`).

```typescript
export class MyComponent {
    onCreate() {
        console.log('Component added to DOM');
        // Good for: DOM measurements, focus management
    }
}
```

### `onRender()`

```typescript
onRender?: () => void
```

Called after each render cycle.

```typescript
export class MyComponent {
    onRender() {
        console.log('Component rendered');
        // Good for: post-render DOM manipulation, third-party library integration
    }
}
```

### `onDestroy()`

```typescript
onDestroy?: () => void
```

Called when the component is removed from the DOM (`disconnectedCallback`).

```typescript
export class MyComponent {
    private interval?: number;

    onCreate() {
        this.interval = setInterval(() => this.tick(), 1000);
    }

    onDestroy() {
        clearInterval(this.interval);
        // Good for: cleanup, unsubscribing, removing event listeners
    }
}
```

### `onAttributeChange()`

```typescript
onAttributeChange?: (attribute: string, oldVal: unknown, newVal: unknown) => void
```

Called when an observed attribute changes.

```typescript
@MelodicComponent({
    selector: 'my-component',
    attributes: ['theme']
})
export class MyComponent {
    theme = 'light';

    onAttributeChange(attribute: string, oldVal: unknown, newVal: unknown) {
        console.log(`${attribute} changed from ${oldVal} to ${newVal}`);
    }
}
```

### `onPropertyChange()`

```typescript
onPropertyChange?: (property: string, oldVal: unknown, newVal: unknown) => void
```

Called when a reactive property changes.

```typescript
export class MyComponent {
    count = 0;

    onPropertyChange(property: string, oldVal: unknown, newVal: unknown) {
        if (property === 'count') {
            console.log(`Count changed from ${oldVal} to ${newVal}`);
        }
    }
}
```

## Property Reactivity

Component properties are automatically made reactive. When a property value changes, the component re-renders.

### How It Works

1. During initialization, `ComponentBase.observe()` wraps each property with getters/setters
2. When a setter is called with a new value, it triggers `render()`
3. The template function is called with the updated component state

### What Gets Observed

Properties are observed **unless** they are:

- **Private** (start with `_`) - Skipped for internal state
- **Functions** - Methods are not observed
- **Signals** - Handled separately via subscriptions
- **`elementRef`** - Reserved property for host element access

```typescript
export class MyComponent {
    // Reactive - changes trigger re-render
    count = 0;
    name = 'John';
    items: string[] = [];

    // NOT reactive - private by convention
    private _cache = new Map();

    // NOT reactive - it's a function
    increment = () => {
        this.count++;
    };

    // NOT reactive - it's a signal (handled separately)
    title = signal('Hello');
}
```

### Preserving Custom Getters/Setters

If you define a getter or setter on your component, the framework preserves it:

```typescript
export class MyComponent {
    private _value = 0;

    get value() {
        return this._value;
    }

    set value(newVal: number) {
        // Custom logic runs, then re-render is triggered
        this._value = Math.max(0, newVal);  // Ensure non-negative
    }
}
```

## Accessing the Host Element

The component instance has access to its host element via `elementRef`:

```typescript
export class MyComponent {
    elementRef!: HTMLElement;

    focusInput() {
        const input = this.elementRef.shadowRoot?.querySelector('input');
        input?.focus();
    }
}
```

**Type:** The `elementRef` is typed as `HTMLElement` but is actually the custom element instance (which extends `HTMLElement`).

## Attributes

### Observing Attributes

To react to attribute changes, list them in the `attributes` array:

```typescript
@MelodicComponent({
    selector: 'theme-toggle',
    attributes: ['theme', 'size'],
    template: (self: ThemeToggle) => html`
        <button class="${self.theme} ${self.size}">Toggle</button>
    `
})
export class ThemeToggle {
    theme = 'light';
    size = 'medium';
}
```

### Attribute to Property Sync

When an attribute changes:
1. If a property with the same name exists, it's updated
2. The component re-renders
3. `onAttributeChange` is called (if defined)

**HTML:**
```html
<theme-toggle theme="dark" size="large"></theme-toggle>
```

### Accessing All Attributes

The template function receives all attributes as its second parameter:

```typescript
template: (self: MyComponent, attrs) => html`
    <div id="${attrs?.id}" data-testid="${attrs?.['data-testid']}">
        Content
    </div>
`
```

## Complete Example

```typescript
import { MelodicComponent, html, css } from '@melodicdev/core';

@MelodicComponent({
    selector: 'todo-item',
    attributes: ['todo-id'],
    template: (self: TodoItem) => html`
        <div class="todo ${self.completed ? 'completed' : ''}">
            <input
                type="checkbox"
                .checked=${self.completed}
                @change=${self.toggle}
            />
            <span class="text">${self.text}</span>
            <button @click=${self.remove}>Delete</button>
        </div>
    `,
    styles: () => css`
        :host {
            display: block;
            margin: 8px 0;
        }
        .todo {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
        }
        .todo.completed .text {
            text-decoration: line-through;
            color: #888;
        }
        .text {
            flex: 1;
        }
        button {
            padding: 4px 8px;
            background: #dc3545;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        }
    `
})
export class TodoItem {
    // Reference to host element
    elementRef!: HTMLElement;

    // Synced with todo-id attribute
    todoId = '';

    // Reactive properties
    text = '';
    completed = false;

    // Event handlers
    toggle = () => {
        this.completed = !this.completed;
        this.dispatchEvent('toggle', { id: this.todoId, completed: this.completed });
    };

    remove = () => {
        this.dispatchEvent('remove', { id: this.todoId });
    };

    // Helper method
    private dispatchEvent(name: string, detail: unknown) {
        this.elementRef.dispatchEvent(new CustomEvent(name, {
            detail,
            bubbles: true
        }));
    }

    // Lifecycle hooks
    onInit() {
        console.log('TodoItem initialized with ID:', this.todoId);
    }

    onCreate() {
        console.log('TodoItem added to DOM');
    }

    onDestroy() {
        console.log('TodoItem removed from DOM');
    }

    onAttributeChange(attr: string, oldVal: unknown, newVal: unknown) {
        console.log(`Attribute ${attr} changed:`, oldVal, '->', newVal);
    }

    onPropertyChange(prop: string, oldVal: unknown, newVal: unknown) {
        console.log(`Property ${prop} changed:`, oldVal, '->', newVal);
    }
}
```

**Usage:**
```html
<todo-item todo-id="1"></todo-item>

<script>
    const item = document.querySelector('todo-item');
    item.text = 'Buy groceries';
    item.addEventListener('toggle', (e) => console.log('Toggled:', e.detail));
    item.addEventListener('remove', (e) => console.log('Remove:', e.detail));
</script>
```

## Content Projection (Slots)

Melodic components use native Shadow DOM slots for content projection - no special framework syntax needed.

### Basic Slots

Define a `<slot>` in your component template to accept projected content:

```typescript
@MelodicComponent({
    selector: 'ui-card',
    template: () => html`
        <div class="card">
            <div class="card-body">
                <slot>Default content if nothing projected</slot>
            </div>
        </div>
    `
})
export class CardComponent {}
```

**Usage:**
```html
<ui-card>
    <p>This content is projected into the slot</p>
</ui-card>
```

### Named Slots

Use named slots for multiple projection points:

```typescript
@MelodicComponent({
    selector: 'ui-card',
    template: () => html`
        <div class="card">
            <div class="card-header">
                <slot name="header">Default Header</slot>
            </div>
            <div class="card-body">
                <slot>Default content</slot>
            </div>
            <div class="card-footer">
                <slot name="footer"></slot>
            </div>
        </div>
    `,
    styles: () => css`
        .card-footer:empty {
            display: none;
        }
    `
})
export class CardComponent {}
```

**Usage:**
```html
<ui-card>
    <span slot="header">Custom Header</span>
    <p>Main content goes in the default slot</p>
    <button slot="footer">Action Button</button>
</ui-card>
```

### Slot Features

| Feature | Description |
|---------|-------------|
| Default slot | `<slot>` without a name receives unassigned content |
| Named slots | `<slot name="x">` receives content with `slot="x"` attribute |
| Fallback content | Content inside `<slot>` shows when nothing is projected |
| CSS `:empty` | Hide slots when nothing is projected |
| `::slotted()` | Style projected content from within the component |

### Styling Slotted Content

Use the `::slotted()` pseudo-element to style projected content:

```typescript
styles: () => css`
    ::slotted(p) {
        margin: 0;
        color: #333;
    }

    ::slotted([slot="header"]) {
        font-weight: bold;
        font-size: 1.2em;
    }
`
```

**Note:** `::slotted()` only selects top-level projected elements, not their descendants.
