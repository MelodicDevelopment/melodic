# Template System

Melodic's template system provides an ultra-fast, declarative way to define component UI using tagged template literals. It uses a "parse once, update forever" strategy for optimal performance.

## Table of Contents

- [Overview](#overview)
- [The html Tag](#the-html-tag)
- [The css Tag](#the-css-tag)
- [The render Function](#the-render-function)
- [Binding Types](#binding-types)
  - [Text Interpolation](#text-interpolation)
  - [Attribute Binding](#attribute-binding)
  - [Property Binding](#property-binding)
  - [Event Binding](#event-binding)
  - [Action Directive Binding](#action-directive-binding)
- [How It Works](#how-it-works)
- [TemplateResult Class](#templateresult-class)
- [Performance Optimizations](#performance-optimizations)
- [Examples](#examples)

## Overview

The template system is built around tagged template literals, providing:

- **Type-safe templates** with full TypeScript support
- **Efficient updates** - only changed values are updated in the DOM
- **Declarative bindings** for events, properties, and attributes
- **Directive support** for advanced rendering patterns

## The html Tag

```typescript
import { html } from '@melodicdev/core';
```

The `html` function is a tagged template literal that creates a `TemplateResult`. It parses the template string once and caches the structure for reuse.

### Signature

```typescript
function html(
    strings: TemplateStringsArray,
    ...values: unknown[]
): TemplateResult
```

### Basic Usage

```typescript
const greeting = html`<h1>Hello, World!</h1>`;

// With interpolation
const name = 'Alice';
const personalized = html`<h1>Hello, ${name}!</h1>`;

// Nested templates
const list = html`
    <ul>
        ${items.map(item => html`<li>${item}</li>`)}
    </ul>
`;
```

## The css Tag

```typescript
import { css } from '@melodicdev/core';
```

The `css` function is an alias for `html`, used for semantic clarity when defining styles.

### Usage

```typescript
const styles = css`
    :host {
        display: block;
        padding: 16px;
    }

    .title {
        font-size: 24px;
        color: #333;
    }

    .highlight {
        background-color: yellow;
    }
`;
```

**Note:** While `css` is functionally identical to `html`, using it for styles makes code more readable and helps distinguish style definitions from markup.

## The render Function

```typescript
import { render } from '@melodicdev/core';
```

The `render` function takes a `TemplateResult` and renders it into a container element.

### Signature

```typescript
function render(
    result: TemplateResult,
    container: Element | DocumentFragment
): void
```

### Usage

```typescript
import { html, render } from '@melodicdev/core';

const template = html`<div>Hello!</div>`;
const container = document.getElementById('app');

render(template, container);
```

**Behavior:**
- On first render: clears container, parses template, inserts nodes
- On subsequent renders: only updates changed values

## Binding Types

### Text Interpolation

Insert dynamic values into text content:

```typescript
const name = 'World';
const count = 42;

html`
    <p>Hello, ${name}!</p>
    <p>Count: ${count}</p>
    <p>Sum: ${1 + 2 + 3}</p>
`
```

**Behavior:**
- Values are converted to strings
- `null` and `undefined` render as empty string
- Updates only touch the text node, not surrounding elements

### Attribute Binding

Bind values to HTML attributes:

```typescript
const id = 'my-element';
const className = 'active';
const isDisabled = true;

html`
    <div id="${id}" class="${className}">
        <button disabled="${isDisabled}">Click</button>
    </div>
`
```

**Behavior:**
- Value is converted to string via `String(value)`
- `null` or `undefined` removes the attribute
- For boolean attributes, consider property binding instead

### Property Binding

Bind values directly to DOM properties using the `.` prefix:

```typescript
const inputValue = 'Hello';
const isChecked = true;
const items = ['a', 'b', 'c'];

html`
    <input type="text" .value=${inputValue} />
    <input type="checkbox" .checked=${isChecked} />
    <my-component .items=${items}></my-component>
`
```

**Syntax:** `.propertyName=${value}`

**When to use property binding:**
- Setting non-string values (objects, arrays, booleans)
- Working with form element values (`input.value`, `checkbox.checked`)
- Passing complex data to custom elements

**Difference from attributes:**
| Aspect | Attribute | Property |
|--------|-----------|----------|
| Type | Always string | Any JavaScript value |
| Access | `getAttribute()` | Direct property access |
| Use case | HTML serialization | Runtime data |

### Event Binding

Bind event handlers using the `@` prefix:

```typescript
const handleClick = (e: Event) => {
    console.log('Clicked!', e);
};

const handleInput = (e: Event) => {
    const input = e.target as HTMLInputElement;
    console.log('Input value:', input.value);
};

html`
    <button @click=${handleClick}>Click Me</button>
    <input @input=${handleInput} @keyup=${handleKeyup} />
`
```

**Syntax:** `@eventName=${handler}`

**Supported events:** Any DOM event (`click`, `input`, `change`, `keyup`, `submit`, etc.)

**Behavior:**
- Event listeners are managed automatically
- When handler changes, old listener is removed, new one added
- Handler receives the native `Event` object

**Inline handlers with arrow functions:**

```typescript
html`
    <button @click=${() => this.count++}>Increment</button>
    <button @click=${(e) => this.handleClick(e, 'extra')}>With Args</button>
`
```

### Action Directive Binding

Attach registered attribute directives to elements using the `:` prefix:

```typescript
html`
    <a :routerLink="/home">Home</a>
    <button :tooltip="Click to save">Save</button>
    <div :clickOutside=${() => this.closeMenu()}>Menu</div>
`
```

**Syntax:** `:directiveName="value"` or `:directiveName=${dynamicValue}`

**Features:**
- Directives are looked up by name from a global registry
- Can use static string values or dynamic interpolated values
- Directives receive the element, value, and directive name
- Cleanup functions are called automatically when values change or element is removed

**Static vs Dynamic values:**

```typescript
// Static string value
html`<a :routerLink="/home">Home</a>`

// Dynamic value
html`<a :routerLink=${currentPath}>Dynamic</a>`

// Object value with options
html`<a :routerLink=${{ href: '/about', exactMatch: true }}>About</a>`
```

**Built-in directives:**
- `routerLink` - Router navigation with active state management
- `formControl` - Bind a FormControl to a native input element
- `portal` - Teleport an element to another DOM container

**Creating custom directives:**

```typescript
import { registerAttributeDirective } from '@melodicdev/core';

registerAttributeDirective('highlight', (element, value) => {
    element.style.backgroundColor = String(value);
    return () => {
        element.style.backgroundColor = '';
    };
});
```

Then use in templates:

```typescript
html`<span :highlight="yellow">Highlighted text</span>`
```

See [Attribute Directives](./ATTRIBUTE_DIRECTIVES.md) for full documentation.

## How It Works

The template system uses a three-phase approach:

### 1. Parse Phase (`getTemplate()`)

On first use of a template:

1. Template strings are joined with a unique marker
2. HTML is analyzed to detect dynamic positions
3. Markers are inserted for events (`__event-N__`), properties (`__prop-N__`), and nodes
4. A `<template>` element is created and cached
5. Part metadata is stored (type, index, name)

```typescript
// This template:
html`<button @click=${handler}>${text}</button>`

// Becomes internally:
// <button __event-0__=""><!--marker--></button>
// With parts: [{ type: 'event', name: 'click', index: 0 }, { type: 'node', index: 1 }]
```

### 2. Prepare Phase (`prepareParts()`)

On first render to a container:

1. Template content is cloned
2. DOM is walked recursively to find markers
3. Markers are replaced with text nodes (for content) or removed (for events/properties)
4. Part references to actual DOM nodes are stored

### 3. Commit Phase (`commit()`)

On every render:

1. Iterate through parts
2. Compare new value with previous value
3. Skip if unchanged (except directives)
4. Apply update based on part type:
   - `node`: Update `textContent` or call directive
   - `attribute`: `setAttribute()` or `removeAttribute()`
   - `property`: Direct property assignment
   - `event`: Remove old listener, add new one

## TemplateResult Class

The `TemplateResult` class encapsulates a parsed template and its values.

### Properties

```typescript
class TemplateResult {
    strings: TemplateStringsArray;  // Static template parts
    values: unknown[];              // Dynamic values
}
```

### Methods

#### `renderInto(container)`

```typescript
renderInto(container: Element | DocumentFragment): void
```

Renders the template into the specified container.

```typescript
const result = html`<div>${message}</div>`;
result.renderInto(document.body);
```

## Performance Optimizations

### Template Caching

Templates are cached by their string parts:

```typescript
// These create the SAME cached template:
html`<div>${a}</div>`
html`<div>${b}</div>`

// Different values don't affect caching - only structure matters
```

### Efficient Updates

Only changed values trigger DOM updates:

```typescript
// Initial render
html`<span class="${cls}">${text}</span>`
// cls='active', text='Hello'

// Re-render with same text, different class
html`<span class="${cls}">${text}</span>`
// cls='inactive', text='Hello'
// Only the class attribute is updated, text node is untouched
```

### Render Batching

Component renders are batched per microtask. Multiple signal or property updates within the same tick coalesce into a single render, reducing redundant work while keeping UI responsive.

### repeat() Keys

The `repeat(items, keyFn, template)` directive relies on stable keys for reuse and ordering. Use a key function that returns a unique, stable identifier (for example, a database id) to ensure correct updates when items are added, removed, or reordered.

### Commit Before Append

On first render, values are committed **before** appending to DOM:

```typescript
renderInto(container) {
    // ... clone template ...
    this.commit(parts);        // Set values first
    container.appendChild(clone);  // Then append
}
```

This ensures custom elements receive their attributes/properties before `connectedCallback` fires.

## Examples

### Dynamic List

```typescript
const items = ['Apple', 'Banana', 'Cherry'];

html`
    <ul>
        ${items.map((item, i) => html`
            <li>
                ${i + 1}. ${item}
            </li>
        `)}
    </ul>
`
```

### Conditional Rendering

```typescript
const isLoggedIn = true;
const user = { name: 'Alice' };

html`
    <header>
        ${isLoggedIn
            ? html`<span>Welcome, ${user.name}!</span>`
            : html`<a href="/login">Log In</a>`
        }
    </header>
`
```

### Form with Bindings

```typescript
@MelodicComponent({
    selector: 'login-form',
    template: (self: LoginForm) => html`
        <form @submit=${self.handleSubmit}>
            <input
                type="email"
                .value=${self.email}
                @input=${self.updateEmail}
                placeholder="Email"
            />
            <input
                type="password"
                .value=${self.password}
                @input=${self.updatePassword}
                placeholder="Password"
            />
            <button type="submit" .disabled=${!self.isValid}>
                Log In
            </button>
        </form>
    `
})
export class LoginForm {
    email = '';
    password = '';

    get isValid() {
        return this.email.length > 0 && this.password.length >= 8;
    }

    updateEmail = (e: Event) => {
        this.email = (e.target as HTMLInputElement).value;
    };

    updatePassword = (e: Event) => {
        this.password = (e.target as HTMLInputElement).value;
    };

    handleSubmit = (e: Event) => {
        e.preventDefault();
        console.log('Submit:', { email: this.email, password: this.password });
    };
}
```

### Nested Components

```typescript
html`
    <div class="container">
        <page-header .title=${pageTitle}></page-header>

        <main>
            ${items.map(item => html`
                <item-card
                    .item=${item}
                    @select=${() => this.selectItem(item.id)}
                ></item-card>
            `)}
        </main>

        <page-footer></page-footer>
    </div>
`
```

### Dynamic Attributes

```typescript
const linkAttrs = {
    href: 'https://example.com',
    target: '_blank',
    rel: 'noopener'
};

html`
    <a
        href="${linkAttrs.href}"
        target="${linkAttrs.target}"
        rel="${linkAttrs.rel}"
    >
        External Link
    </a>
`
```

### Combining with Directives

```typescript
import { html, repeat, when, classMap, styleMap } from '@melodicdev/core';

html`
    <div class=${classMap({ container: true, dark: isDarkMode })}>
        ${when(isLoading, () => html`<loading-spinner></loading-spinner>`)}

        <ul style=${styleMap({ maxHeight: `${maxHeight}px` })}>
            ${repeat(
                items,
                item => item.id,
                item => html`<li>${item.name}</li>`
            )}
        </ul>
    </div>
`
```
