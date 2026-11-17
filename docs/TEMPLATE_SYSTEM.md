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
  - [Boolean Attribute Binding](#boolean-attribute-binding)
  - [Property Binding](#property-binding)
  - [Event Binding](#event-binding)
  - [Action Directive Binding](#action-directive-binding)
- [Built-in Directives](#built-in-directives)
- [How It Works](#how-it-works)
- [TemplateResult Class](#templateresult-class)
- [Performance Optimizations](#performance-optimizations)
- [Examples](#examples)
- [`live()`](#live)
- [Directives inside composite attributes](#directives-inside-composite-attributes)
- [Bindings the parser cannot see](#bindings-the-parser-cannot-see)
- [Binding order on one element](#binding-order-on-one-element)
- [Attribute bindings that can run script](#attribute-bindings-that-can-run-script)

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

The `css` tag creates a stylesheet. Its result is used the same way an `html` result is — as a component's `styles`, nested in another result, or passed to `render()` — but the text is treated as CSS, never as HTML.

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

**Note:** The stylesheet text is used verbatim. `css` was once an alias of `html`, which sent styles through the HTML parser: entities were decoded and anything that looked like a tag was dropped, so `content: "&lt;b&gt;"` became `content: "<b>"`. That no longer happens. Interpolated values are inserted as text; another `css` result (for example a shared `resetStyles`) can be interpolated into a stylesheet.

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
- Rendering a template with a different structure (a different `html` literal) into the same container disposes the previous content, running its directive cleanups, and rebuilds

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
- Primitive values are converted to strings with `String(value)`
- `null` and `undefined` render as empty string
- `false` is not special-cased: it renders the text `false`. An expression such as `${isReady && label}` therefore prints `false` when the condition fails; use a ternary or [`when()`](#when)
- A nested `html` template, a DOM `Node`, an array of these, or a directive result is rendered as content instead of being stringified
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
- `null`, `undefined` or `false` removes the attribute
- `true` sets the attribute with an empty value (`disabled=""`)
- On `aria-*` attributes a boolean is written as the literal string `"true"` or `"false"`, never added or removed
- Any other value is converted to string via `String(value)`
- The quotes around the binding are optional: `id=${id}` and `id="${id}"` are the same binding
- An attribute may mix static text with one or more bindings (`class="btn ${variant} ${size}"`). Each value is then stringified into the whole attribute, with `null` and `undefined` as empty text

### Boolean Attribute Binding

Add or remove an attribute by truthiness using the `?` prefix:

```typescript
html`
    <button ?disabled=${!isValid}>Save</button>
    <details ?open=${isExpanded}>...</details>
`
```

**Syntax:** `?attributeName=${condition}`

**Behavior:**
- A truthy value sets the attribute with an empty value
- A falsy value (`false`, `0`, `''`, `null`, `undefined`) removes it
- Do not use it for ARIA state attributes, which need the strings `"true"`/`"false"`; a plain `aria-expanded=${isOpen}` binding writes those

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

**Behavior:**
- The property is assigned only when the bound value differs (`===`) from the one bound on the previous render. For a field the user can edit, see [`live()`](#live)
- Binding `.innerHTML` or `.outerHTML` assigns raw HTML and logs a dev-mode warning; prefer text interpolation, or [`unsafeHTML()`](#unsafehtml) with sanitized content

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
- One listener is registered per binding and kept across renders. When the handler changes, the new handler is swapped in behind it; the listener itself is not removed and re-added
- Handler receives the native `Event` object. A `function` handler is called with `this` set to the element the binding is on
- A value that is neither a function nor a `handleEvent` object (`undefined`, `null`) detaches the listener
- The listener is removed when the element's template is torn down

**Listener options:**

To pass `capture`, `once` or `passive`, bind an object with a `handleEvent` method and the option flags:

```typescript
html`
    <div @scroll=${{ handleEvent: (e: Event) => this.onScroll(e), passive: true }}></div>
`
```

Changing an option re-attaches the listener. A `once` listener that has already fired is re-armed when a different handler object is bound, so keep the object in a field (rather than creating it in the template) when it must fire only once.

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

`tooltip` and `clickOutside` above stand for directives you register yourself. A name with no registered directive logs a console warning and does nothing.

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
- `formControl` - Bind an AbstractControl (FormControl/FormGroup/FormArray) to any element with a registered adapter
- `model` - Two-way bind a signal to any element with a registered adapter
- `portal` - Teleport an element to another DOM container

**Creating custom directives:**

```typescript
import { registerAttributeDirective } from '@melodicdev/core';

registerAttributeDirective('highlight', (element, value) => {
    const el = element as HTMLElement;
    el.style.backgroundColor = String(value);
    return () => {
        el.style.backgroundColor = '';
    };
});
```

Then use in templates:

```typescript
html`<span :highlight="yellow">Highlighted text</span>`
```

See [Attribute Directives](./ATTRIBUTE_DIRECTIVES.md) for full documentation.

## Built-in Directives

A directive is a function called inside a binding. All of these are exported from `@melodicdev/core`:

| Directive | Used in | Purpose |
|-----------|---------|---------|
| `when(condition, template, falseTemplate?)` | Content | Conditional rendering |
| `repeat(items, keyFn, template)` | Content | Keyed list rendering |
| `repeatRaw(items, keyFn, factory, update?)` | Content | Keyed list built with raw DOM calls. Deprecated; prefer `repeat()` |
| `classMap(classes)` | `class` attribute | Conditional CSS classes |
| `styleMap(styles)` | `style` attribute | Inline styles from an object |
| `unsafeHTML(html)` | Content | Render a string as HTML |
| `live(value)` | Property binding | Compare against the DOM's current value |

`repeat()` and `repeatRaw()` are described under [repeat() Keys](#repeat-keys) and [repeatRaw()](#repeatraw), and `live()` under [`live()`](#live).

### when()

```typescript
function when(
    condition: boolean,
    template: () => TemplateResult,
    falseTemplate?: () => TemplateResult
): IDirectiveResult
```

Renders `template()` while `condition` is true. While it is false, renders `falseTemplate()` if one is given and nothing otherwise.

```typescript
html`
    ${when(
        user !== null,
        () => html`<span>Welcome, ${user!.name}!</span>`,
        () => html`<a href="/login">Log In</a>`
    )}
`
```

Both branches are functions, and only the branch that renders is called. That makes the null-guard above safe: `user!.name` is never evaluated while `user` is `null`. When the condition flips, the old branch is removed from the DOM and the cleanups of any directives inside it run. While the condition stays the same, the rendered branch is updated in place.

### classMap()

```typescript
function classMap(classes: Record<string, boolean | undefined>): IDirectiveResult
```

Adds every class whose value is truthy and removes the classes it added on a previous render that are no longer truthy. Classes it did not add are left alone, so it can share the `class` attribute with static text (see [Directives inside composite attributes](#directives-inside-composite-attributes)).

```typescript
html`<div class=${classMap({ active: isActive, disabled: isDisabled })}></div>`
```

### styleMap()

```typescript
function styleMap(styles: Record<string, string | number | undefined>): IDirectiveResult
```

Sets each property on the element's inline style. Property names may be camelCase (`backgroundColor`) or kebab-case. A custom property (`'--card-accent'`) is written exactly as given, so its capitalisation is preserved. A property whose value is `undefined`, or that is absent from a later render, is removed. Values are written as given; see the note on units under [Combining with Directives](#combining-with-directives).

```typescript
html`<div style=${styleMap({ backgroundColor: color, opacity: 0.5 })}></div>`
```

### unsafeHTML()

```typescript
function unsafeHTML(html: string): IDirectiveResult
```

Parses a string as HTML and inserts the resulting nodes at the binding. The content is re-parsed only when the string changes.

```typescript
html`<div class="article">${unsafeHTML(sanitizedMarkup)}</div>`
```

The string is not sanitized or escaped. Use it only with markup you trust or have sanitized; passing user input straight through is an XSS hole.

### Writing a value directive

`directive(renderFn, type?)` builds a directive of the same kind as the ones above. `renderFn` is called on every render with the node the binding sits on, the state it returned last time, and (in an attribute or property binding) the bound name. Whatever it returns is handed back as `previousState` on the next render.

```typescript
import { directive, html } from '@melodicdev/core';

const upper = (text: string) =>
    directive((node, previous?: string) => {
        if (previous !== text) {
            node.textContent = text.toUpperCase();
        }
        return text;
    }, 'upper');

html`<p>${upper(name)}</p>`
```

In a content binding `node` is the binding's text node; in an attribute or property binding it is the element.

- `type` identifies the directive. When a binding switches from one directive type to another, the old state is disposed and the new directive starts with no previous state. Directives created without a type are all treated as the same directive.
- If the returned state is an object with a `__dispose()` method, it is called when the directive's content is discarded: the binding switches to another value, a parent removes it, or the host is torn down. Release listeners and subscriptions there; do not remove DOM nodes in it.
- A content directive that replaces its text node with a range of nodes should also expose the `startMarker` and `endMarker` comments bounding that range on its state, so the engine can clear the range when the binding switches away from the directive.

The state contract is the exported `IDirectiveState` type. A class extending the exported abstract `Directive` class and implementing `render(container, previousState)` can be bound in the same way.

## How It Works

The template system uses a three-phase approach:

### 1. Parse Phase (`getTemplate()`)

On first use of a template:

1. Template strings are joined with a unique marker
2. HTML is analyzed to detect dynamic positions
3. Markers are inserted for events (`__event-N__`), properties (`__prop-N__`), boolean attributes (`__bool-N__`), action directives (`__action-N__`), attribute values, and nodes
4. A `<template>` element is created and cached. The cache is keyed by the template literal itself, so a literal is parsed once for the life of the page; a secondary 500-entry cache only de-duplicates different literals that happen to have identical text
5. Part metadata is stored (type, index, name), along with the path from the template root to each marker

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
2. Each marker is reached through the path recorded in the parse phase; the clone is not searched
3. Markers are replaced with text nodes (for content) or removed (for attributes, events, properties and directives)
4. Part references to actual DOM nodes are stored

### 3. Commit Phase (`commit()`)

On every render:

1. Iterate through parts
2. Compare new value with previous value
3. Skip if unchanged (except directives)
4. Apply update based on part type:
   - `node`: Update `textContent`, render a nested template, node or array, or call directive
   - `attribute`: `setAttribute()` or `removeAttribute()`
   - `boolean-attribute`: Add or remove the attribute
   - `property`: Direct property assignment
   - `event`: Swap the handler behind the part's listener
   - `action`: Run the previous cleanup, then call the attribute directive

## TemplateResult Class

The `TemplateResult` class encapsulates a parsed template and its values.

### Properties

```typescript
class TemplateResult {
    strings: TemplateStringsArray;  // Static template parts
    values: unknown[];              // Dynamic values
    readonly templateKey: string;   // Identity of the template's structure
}
```

Two results created by the same `html` literal have the same `templateKey`, whatever their values. A result with the same key as the content already in a container is applied as an in-place update; a different key rebuilds the content.

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

### Arrays and DOM Identity

An interpolated array — the plain `${items.map(item => html`…`)}` form — is reused **by index**. On re-render, index `i` of the new array updates the nodes created for index `i` of the previous one:

| Change | Behaviour |
|--------|-----------|
| Same length, same structure | Every node reused, content updated in place |
| Array grew | Leading items reused, the rest created |
| Array shrank | Survivors reused, the tail disposed and removed |
| Value type changed at an index (template ↔ Node ↔ primitive) | Just that index is rebuilt, in place |
| Items reordered | Nodes stay at their index — the *content* shifts between them |

Reuse preserves node identity, which matters more than it looks. The browser only fires `click` when `mousedown` and `mouseup` land on the same node, so a list that rebuilds between press and release cannot be clicked at all. Focus, text selection, scroll position, `:hover`, CSS transitions, and `IntersectionObserver`/`ResizeObserver` registrations are lost the same way.

> **Changed in 3.1.0.** Unkeyed arrays previously tore down and rebuilt their entire subtree on every render. See [Behaviour change](#behaviour-change-in-310) below.

### repeat() Keys

The `repeat(items, keyFn, template)` directive relies on stable keys for reuse and ordering. Use a key function that returns a unique, stable identifier (for example, a database id) to ensure correct updates when items are added, removed, or reordered. `keyFn` and `template` both receive `(item, index)`. A key that appears twice in one list logs a dev-mode warning.

Index-based reuse has no notion of item identity, so reach for `repeat()` when a list is **reordered, sorted, filtered, or has items inserted anywhere but the end** — anything where item *n* of this render is not the same thing as item *n* of the last one. Without keys the DOM at each index is retargeted to a different item, which is visually correct but moves per-node state (focus, an open menu, an in-progress selection) to the wrong row.

In dev builds, an array that actually churns — several items rebuilt in a single update — logs a one-time console advisory pointing at `repeat()`. A plain `.map()` that reuses cleanly is never warned about. Mixing keyed and unkeyed items in one array also warns: keyed diffing requires *every* item to carry a key, so a single unkeyed entry silently demotes the whole array to index-based reuse.

### repeatRaw()

> **Deprecated — prefer `repeat()`.** `repeatRaw` re-appends every element whenever a key is added, removed or moved, and the elements it creates get no bindings or cleanup from the template engine. It keeps working and is not scheduled for removal.

`repeatRaw(items, keyFn, factory, update?)` bypasses the template system and builds each row with raw DOM APIs. Pass the optional `update(element, item, index)` callback to keep row identity across renders — `factory` then runs only for keys that are new, and existing rows are updated in place (focus, scroll position and animations survive). Without `update`, `factory` runs for every row on every render, and the element it returns replaces the previous one for that key.

```typescript
repeatRaw(
	rows,
	(row) => row.id,
	(row) => {
		const li = document.createElement('li');
		li.textContent = row.label;
		return li;
	},
	(li, row) => {
		li.textContent = row.label;
	}
)
```

### Behaviour change in 3.1.0

Before 3.1.0 an unkeyed array disposed and recreated every one of its nodes on each render. Two consequences of the fix are worth checking in existing apps:

- **Custom elements inside unkeyed arrays are no longer recreated per render.** `onCreate`/`onDestroy` (and `connectedCallback`/`disconnectedCallback`) fired on every render before, and now fire once. Setup work in `onCreate` that happened to re-run each frame will run only on the real creation — and per-render work that was accidentally leaking is now correct.
- **Per-node DOM state persists across renders.** Uncontrolled state — a native input's typed value, scroll position, an open `<details>` — used to reset each render because the node was new. It now survives, like every other framework. Drive that state from the template if you need it reset.

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

Note the `` `${maxHeight}px` `` above — that unit is load-bearing. `styleMap` emits values as-is and never infers units, so a bare number on a length property (`{ maxHeight: 400 }`) produces invalid CSS that the browser drops silently. This differs from React's style object, which appends `px` for you. Bare numbers remain correct for unitless properties such as `opacity` and `zIndex`.

## `live()`

Property bindings skip the write when the bound value is unchanged. That is right for
everything except a control the user can edit: after typing in
`<input .value=${text}>`, resetting `text` to the value it already had writes nothing, and
the typed text stays on screen. `live()` compares against the element's **current**
property instead:

```typescript
import { live } from '@melodicdev/core';

html`<input .value=${live(this.text)} @input=${this.onInput} />`;
```

Use it for `value`, `checked`, `selected` and similar user-mutable properties; a plain
binding remains cheaper everywhere else.

## Directives inside composite attributes

A directive may sit alongside static text in one attribute. The static segments are written
first, then the directives run against the element, so an additive directive such as
`classMap` layers on top:

```typescript
html`<div class="card ${classMap({ active: isActive })}">…</div>`;
// class="card active"
```

Each directive segment keeps its own state, so several may share one attribute.

## Bindings the parser cannot see

The parser tracks whether the cursor is inside an open tag, so text that merely looks like
an attribute is treated as text:

```typescript
html`<p>Total=${total}</p>`;   // renders the value
```

These positions still cannot carry a binding, and dev mode reports each one with the
offending snippet:

- inside a raw-text element (`<textarea>`, `<title>`)
- in tag-name position (`` html`<${tag}>` ``)
- inside an HTML comment

Dev mode also reports a binding that parsed but could not be attached to any node ("Template part marker leaked"). The usual cause is an unbalanced quote in an attribute value, which makes the HTML parser swallow the markup after it. In production none of these throw; the binding simply never renders or updates.

## Binding order on one element

Bindings on the same element are committed in the order they are written in the template,
whatever their kind:

```typescript
html`<input type="range" min=${min} max=${max} .value=${value} />`;
// min, then max, then value
```

Order matters where one binding constrains another. A range input clamps `value` to
`min`/`max` at the moment it is set, so `value` must be written after them; a custom
element that validates one property against another has the same requirement. Put the
dependent binding last.

## Attribute bindings that can run script

Two kinds of attribute binding turn a string into code. Neither is blocked, because the
value may be trusted, but dev mode warns about both:

- a value starting with `javascript:` bound to `href`, `src`, `action`, `formaction` or
  `xlink:href` (`attr-javascript-url`). Validate the scheme before binding a URL that
  comes from user input;
- a string bound to an inline handler attribute such as `onclick` (`attr-inline-handler`).
  Use an event binding instead: `@click=${handler}`.
