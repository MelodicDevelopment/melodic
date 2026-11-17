# Attribute Directives

Attribute directives allow you to attach behavior to any element using a clean, declarative syntax. They are registered by name and invoked using the `:directiveName` binding.

## Table of Contents

- [Overview](#overview)
- [Using Attribute Directives](#using-attribute-directives)
- [Built-in Directives](#built-in-directives)
   - [routerLink](#routerlink)
   - [formControl](#formcontrol)
   - [model](#model)
   - [portal](#portal)

- [Creating Custom Directives](#creating-custom-directives)
- [Directive Lifecycle](#directive-lifecycle)
- [Examples](#examples)
- [API Reference](#api-reference)

## Overview

Attribute directives provide a way to:

- Add behavior to elements without creating wrapper components
- Attach event listeners and manage cleanup automatically
- Respond to value changes
- Keep templates clean and declarative

**Syntax:** `:directiveName="value"` or `:directiveName=${dynamicValue}`

## Using Attribute Directives

### Static Values

Use static strings directly in the attribute:

```html
<a :routerLink="/home">Home</a>
<button :routerLink="/admin">Admin Panel</button>
<div :tooltip="This is helpful information">Hover me</div>
```

A static value always reaches the directive as a string, and a directive with a static value runs once. An attribute written with no value (`<input :autoFocus />`) passes the empty string.

(`tooltip`, `clickOutside` and `autoFocus` in this guide are custom directives, defined under [Creating Custom Directives](#creating-custom-directives). A name with no registered directive logs a console warning and does nothing.)

### Dynamic Values

Use template interpolation for dynamic values:

```html
<a :routerLink=${currentPath}>Dynamic Link</a>
<button :tooltip=${tooltipText}>Hover me</button>
```

### Object Values

Some directives accept objects for advanced configuration:

```html
<a :routerLink=${{ href: '/about', exactMatch: true, activeClass: 'selected' }}>About</a>
```

## Built-in Directives

Each built-in directive registers itself when its module is imported. Importing anything from `@melodicdev/core` registers all four. With the sub-entry imports, `routerLink` comes with `@melodicdev/core/routing`, `formControl` and `model` with `@melodicdev/core/forms`, and `portal` with `@melodicdev/core/template`.

### routerLink

The `routerLink` directive adds router navigation behavior to any element.

#### Basic Usage

```html
<!-- On anchor tags (automatically sets href for accessibility) -->
<a :routerLink="/home">Home</a>
<a :routerLink="/users/123">View User</a>

<!-- On any element -->
<button :routerLink="/settings">Settings</button>
<div :routerLink="/dashboard" class="card">Go to Dashboard</div>
```

#### With Options

```html
<a :routerLink=${{ href: '/about', exactMatch: true }}>About</a>
<a :routerLink=${{ href: '/admin', activeClass: 'current', replace: true }}>Admin</a>
```

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `href` | `string` | required | Target path for navigation |
| `activeClass` | `string` | `'active'` | CSS class applied when route is active |
| `exactMatch` | `boolean` | `false` | Match exact path only (not prefixes) |
| `replace` | `boolean` | `false` | Replace history entry instead of push |
| `data` | `unknown` | `null` | Custom data to pass with navigation |
| `queryParams` | `Record<string, string>` | `{}` | Query parameters to append |

#### Features

- **Automatic href:** On anchor elements, sets the `href` attribute (including `queryParams`) for accessibility, right-click "copy link", and SEO
- **Modifier keys and middle click:** Ctrl/Cmd/Shift/Alt+click and middle click are left to the browser on anchors (new tab, new window, download). On any other element they open the target in a new tab
- **Active state:** Automatically adds/removes the active class based on the current URL path, and updates it on every navigation
- **Accessibility:** Sets `aria-current="page"` on active anchor elements
- **Safe URLs:** Only relative, query, hash and `http(s)` URLs are accepted. Any other scheme (`javascript:`, `data:`, ...) logs a console warning; the `href` is not set and a click does not navigate
- **Styling hook:** Adds an empty `router-link` attribute to the element
- **Cleanup:** Event listeners are automatically removed when element is removed

The value must be a string or an object with an `href`. Anything else logs a console warning and the directive does nothing.

#### Active State Matching

By default, `routerLink` uses prefix matching:

```html
<!-- Both are active when URL is /admin/users -->
<a :routerLink="/admin">Admin</a>        <!-- active (prefix match) -->
<a :routerLink="/admin/users">Users</a>  <!-- active (exact match) -->
```

Use `exactMatch` to require exact path matching:

```html
<a :routerLink=${{ href: '/admin', exactMatch: true }}>Admin</a>
<!-- Only active when URL is exactly /admin -->
```

### formControl

The `formControl` directive binds an `AbstractControl` (FormControl, FormGroup, FormArray) to any element with a registered adapter — native form elements and Melodic form components are supported out of the box.

```html
<input type="text" :formControl=${nameControl} />
<input type="checkbox" :formControl=${acceptedControl} />
<select :formControl=${countryControl}></select>
<ml-input :formControl=${emailControl}></ml-input>
```

It keeps the control and DOM in sync, applies CSS state classes (`mf-valid`, `mf-invalid`, `mf-dirty`, `mf-pristine`, `mf-touched`, `mf-pending`, `mf-disabled`), and writes the resolved validator message to the host's `error` attribute when touched + invalid.

When the element's value is written to the control follows the control's `updateOn` (`'change'`, `'blur'` or `'submit'`). A value that is not an `AbstractControl`, or an element with no registered adapter, logs a console warning and binds nothing.

Custom elements can register their own adapter via `registerAdapter` from `@melodicdev/core/forms`. See `docs/FORMS.md` for full usage.

### model

The `model` directive binds a signal two-way to any element with a registered adapter. Pass the signal itself, not its value:

```typescript
import { signal } from '@melodicdev/core';

class SearchBox {
  query = signal('');
}
```

```html
<input type="text" :model=${this.query} />
<ml-input label="Search" :model=${this.query}></ml-input>
```

The signal's value is written to the element, and the element's value is written back to the signal on the adapter's input event. It uses the same adapters as `formControl`, so it works with checkboxes, selects and the Melodic form components as well as text inputs.

`model` carries no validation and no touched/dirty state; use `formControl` when you need those. A value that is not a signal, or an element with no registered adapter, logs a dev-mode warning and binds nothing.

### portal

The `portal` directive teleports an element to another part of the DOM tree.

```html
<div :portal="#overlay-root">I render elsewhere</div>
```

See `docs/PORTAL.md` for full behavior and options.

## Creating Custom Directives

### Registration

Register directives using `registerAttributeDirective`:

```typescript
import { registerAttributeDirective } from '@melodicdev/core';

registerAttributeDirective('myDirective', (element, value, name) => {
  // Setup logic here
  console.log(`Directive ${name} applied with value:`, value);

  // Return cleanup function (optional)
  return () => {
    console.log('Cleanup');
  };
});
```

Register a directive before any template that uses it renders. Registering a name that already exists replaces the earlier directive.

Names are matched case-insensitively. HTML lower-cases attribute names, so a static `:myDirective="x"` reaches the template engine as `:mydirective` and still finds the directive registered as `myDirective`.

### Directive Function Signature

```typescript
type AttributeDirectiveFunction = (
  element: Element,    // The DOM element
  value: unknown,      // The value passed to the directive
  name: string         // The directive name
) => (() => void) | void;
```

`AttributeDirectiveFunction` and the cleanup type `AttributeDirectiveCleanupFunction` (`() => void`) are exported from `@melodicdev/core`.

`element` is typed as `Element`; cast it (`element as HTMLElement`) to reach `style`, `focus()` and the typed DOM event overloads. `name` is the name as written in the template for a dynamic binding, and lower-cased for a static one.

### Example: Tooltip Directive

```typescript
import { registerAttributeDirective } from '@melodicdev/core';

registerAttributeDirective('tooltip', (element, value, _name) => {
  const el = element as HTMLElement;
  const text = String(value);

  // Create tooltip element
  const tooltip = document.createElement('div');
  tooltip.className = 'tooltip';
  tooltip.textContent = text;
  tooltip.style.cssText = `
    position: absolute;
    background: #333;
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    display: none;
    z-index: 1000;
  `;
  document.body.appendChild(tooltip);

  // Position and show on hover
  const showTooltip = (e: MouseEvent) => {
    tooltip.style.left = `${e.pageX + 10}px`;
    tooltip.style.top = `${e.pageY + 10}px`;
    tooltip.style.display = 'block';
  };

  const hideTooltip = () => {
    tooltip.style.display = 'none';
  };

  el.addEventListener('mouseenter', showTooltip);
  el.addEventListener('mousemove', showTooltip);
  el.addEventListener('mouseleave', hideTooltip);

  // Cleanup function
  return () => {
    el.removeEventListener('mouseenter', showTooltip);
    el.removeEventListener('mousemove', showTooltip);
    el.removeEventListener('mouseleave', hideTooltip);
    tooltip.remove();
  };
});
```

Usage:

```html
<button :tooltip="Save your changes">Save</button>
<span :tooltip=${dynamicTooltip}>Hover for info</span>
```

### Example: Click Outside Directive

```typescript
import { registerAttributeDirective } from '@melodicdev/core';

registerAttributeDirective('clickOutside', (element, value, _name) => {
  if (typeof value !== 'function') {
    console.warn('clickOutside: Expected a function');
    return;
  }

  const handler = (e: Event) => {
    if (!element.contains(e.target as Node)) {
      value(e);
    }
  };

  // Use setTimeout to avoid triggering on the click that opened the element
  setTimeout(() => {
    document.addEventListener('click', handler);
  }, 0);

  return () => {
    document.removeEventListener('click', handler);
  };
});
```

Usage:

```html
<div class="dropdown" :clickOutside=${() => this.closeDropdown()}>
  <button>Toggle</button>
  <div class="menu">...</div>
</div>
```

### Example: Auto-Focus Directive

```typescript
import { registerAttributeDirective } from '@melodicdev/core';

registerAttributeDirective('autoFocus', (element, value, _name) => {
  // Focus unconditionally (static usage) or based on a condition
  if (value === '' || value === true || value === 'true') {
    // The directive first runs before the element is in the document,
    // where focus() does nothing, so wait for the render to finish.
    queueMicrotask(() => (element as HTMLElement).focus?.());
  }
});
```

Usage:

```html
<input type="text" :autoFocus />
<input type="text" :autoFocus=${shouldFocus} />
```

## Directive Lifecycle

### Initialization

Directives are initialized when the template is first rendered:

1. Template is parsed and rendered
2. Element with `:directive` is created
3. Directive function is called with element and value
4. Optional cleanup function is stored

On that first render the directive runs before the rendered content is inserted into the document: bindings are applied to the new nodes first, and the nodes are attached afterwards. The element is therefore not connected yet, so anything that needs it in the document (`focus()`, measuring its size or position) has to be deferred, for example with `queueMicrotask`.

### Updates (Dynamic Values)

When using dynamic values (`:directive=${value}`), the directive is re-run when the value changes:

1. Previous cleanup function is called (if exists)
2. Directive function is called with new value
3. New cleanup function is stored

Values are compared by identity (`===`). An object literal or arrow function written inline in the template is a new value on every render, so the directive is cleaned up and re-run on every render. When setup is expensive, or the directive holds state that must survive a render, bind a value that stays the same between renders, such as a component field.

### Cleanup

Cleanup functions are called when:

- The directive value changes (before re-initialization)
- The part of the template containing the element is removed (a `when()` branch turns false, a list item is dropped, the template is replaced by a different one)
- The component is destroyed

**Always return a cleanup function** if your directive:

- Adds event listeners
- Creates DOM elements
- Sets up timers or intervals
- Subscribes to external events

## Examples

### Navigation Bar with Active States

```typescript
import { html } from '@melodicdev/core';

const template = html`
  <nav class="navbar">
    <a :routerLink="/" class="logo">MyApp</a>

    <div class="nav-links">
      <a :routerLink="/dashboard">Dashboard</a>
      <a :routerLink="/projects">Projects</a>
      <a :routerLink="/settings">Settings</a>
    </div>

    <a :routerLink=${{ href: '/profile', exactMatch: true }}>
      Profile
    </a>
  </nav>
`;
```

### Dynamic Links from Data

```typescript
import { html } from '@melodicdev/core';

const navItems = [
  { path: '/home', label: 'Home' },
  { path: '/about', label: 'About' },
  { path: '/contact', label: 'Contact' }
];

const template = html`
  <nav>
    ${navItems.map(item => html`
      <a :routerLink=${item.path}>${item.label}</a>
    `)}
  </nav>
`;
```

### Combining Multiple Directives

```typescript
import { html } from '@melodicdev/core';

const template = html`
  <button
    :routerLink="/save"
    :tooltip="Save and continue"
    class="btn-primary"
  >
    Save
  </button>
`;
```

### Form with Auto-Focus

```typescript
import { html } from '@melodicdev/core';

const template = html`
  <form>
    <input
      type="text"
      name="search"
      :autoFocus
      placeholder="Search..."
    />
    <button type="submit">Search</button>
  </form>
`;
```

## API Reference

### registerAttributeDirective

```typescript
function registerAttributeDirective(
  name: string,
  directive: AttributeDirectiveFunction
): void
```

Registers a directive that can be used with `:name` syntax. A second registration under the same name replaces the first.

### getAttributeDirective

```typescript
function getAttributeDirective(
  name: string
): AttributeDirectiveFunction | undefined
```

Retrieves a registered directive by name. An exact match wins; otherwise the name is matched case-insensitively.

### hasAttributeDirective

```typescript
function hasAttributeDirective(name: string): boolean
```

Checks if a directive is registered, with the same matching as `getAttributeDirective`.

### unregisterAttributeDirective

```typescript
function unregisterAttributeDirective(name: string): boolean
```

Removes a registered directive. Returns `true` if found and removed. Unlike lookup, the name must match the registered name exactly, including case.

### getRegisteredDirectives

```typescript
function getRegisteredDirectives(): string[]
```

Returns an array of all registered directive names, as they were registered.
