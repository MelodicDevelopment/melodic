# Attribute Directives

Attribute directives allow you to attach behavior to any element using a clean, declarative syntax. They are registered by name and invoked using the `:directiveName` binding.

## Table of Contents

- [Overview](#overview)
- [Using Attribute Directives](#using-attribute-directives)
- [Built-in Directives](#built-in-directives)
   - [routerLink](#routerlink)

- [Creating Custom Directives](#creating-custom-directives)
- [Directive Lifecycle](#directive-lifecycle)
- [Examples](#examples)

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

- **Automatic href:** On anchor elements, sets the `href` attribute for accessibility, right-click "copy link", and SEO
- **Modifier keys:** Ctrl/Cmd+click opens in new tab
- **Active state:** Automatically adds/removes the active class based on current route
- **Accessibility:** Sets `aria-current="page"` on active anchor elements
- **Cleanup:** Event listeners are automatically removed when element is removed

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

## Creating Custom Directives

### Registration

Register directives using `registerAttributeDirective`:

```typescript
import { registerAttributeDirective } from 'melodic';

registerAttributeDirective('myDirective', (element, value, name) => {
  // Setup logic here
  console.log(`Directive ${name} applied with value:`, value);

  // Return cleanup function (optional)
  return () => {
    console.log('Cleanup');
  };
});
```

### Directive Function Signature

```typescript
type AttributeDirectiveFunction = (
  element: Element,    // The DOM element
  value: unknown,      // The value passed to the directive
  name: string         // The directive name
) => (() => void) | void;
```

### Example: Tooltip Directive

```typescript
import { registerAttributeDirective } from 'melodic';

registerAttributeDirective('tooltip', (element, value, _name) => {
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

  element.addEventListener('mouseenter', showTooltip);
  element.addEventListener('mousemove', showTooltip);
  element.addEventListener('mouseleave', hideTooltip);

  // Cleanup function
  return () => {
    element.removeEventListener('mouseenter', showTooltip);
    element.removeEventListener('mousemove', showTooltip);
    element.removeEventListener('mouseleave', hideTooltip);
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
import { registerAttributeDirective } from 'melodic';

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
import { registerAttributeDirective } from 'melodic';

registerAttributeDirective('autoFocus', (element, value, _name) => {
  // Focus immediately or based on condition
  if (value === '' || value === true || value === 'true') {
    (element as HTMLElement).focus?.();
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

### Updates (Dynamic Values)

When using dynamic values (`:directive=${value}`), the directive is re-run when the value changes:

1. Previous cleanup function is called (if exists)
2. Directive function is called with new value
3. New cleanup function is stored

### Cleanup

Cleanup functions are called when:

- The directive value changes (before re-initialization)
- The element is removed from the DOM
- The component is destroyed

**Always return a cleanup function** if your directive:

- Adds event listeners
- Creates DOM elements
- Sets up timers or intervals
- Subscribes to external events

## Examples

### Navigation Bar with Active States

```typescript
import { html } from 'melodic';

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
import { html } from 'melodic';

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
import { html } from 'melodic';

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
import { html } from 'melodic';

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

Registers a directive that can be used with `:name` syntax.

### getAttributeDirective

```typescript
function getAttributeDirective(
  name: string
): AttributeDirectiveFunction | undefined
```

Retrieves a registered directive by name.

### hasAttributeDirective

```typescript
function hasAttributeDirective(name: string): boolean
```

Checks if a directive is registered.

### unregisterAttributeDirective

```typescript
function unregisterAttributeDirective(name: string): boolean
```

Removes a registered directive. Returns `true` if found and removed.

### getRegisteredDirectives

```typescript
function getRegisteredDirectives(): string[]
```

Returns an array of all registered directive names.
