# Directives - Quick Reference

## Built-in Directives

### 📋 `repeat()` - Keyed Lists
Efficiently renders lists with minimal DOM operations.

```typescript
import { html, repeat } from '@melodicdev/core';

html`
  <ul>
    ${repeat(
      todos,
      todo => todo.id,           // Key function
      (todo, index) => html`     // Template
        <li>${todo.text}</li>
      `
    )}
  </ul>
`
```

**Performance:** Only updates changed items, not the entire list!

---

### 🔀 `when()` - Conditional Rendering
Shows/hides content based on a condition.

```typescript
import { html, when } from '@melodicdev/core';

html`
  ${when(isLoggedIn, () => html`
    <div>Welcome back!</div>
  `)}
`
```

**Tip:** Completely removes from DOM when false (not just `display: none`).

---

### 🎨 `classMap()` - Dynamic Classes
Apply CSS classes based on conditions.

```typescript
import { html, classMap } from '@melodicdev/core';

html`
  <div class=${classMap({
    active: isActive,
    disabled: !isEnabled,
    'has-error': hasError
  })}></div>
`
```

**Result:** `<div class="active has-error"></div>`

---

### 💅 `styleMap()` - Dynamic Styles
Apply inline styles from an object.

```typescript
import { html, styleMap } from '@melodicdev/core';

html`
  <div style=${styleMap({
    color: textColor,
    fontSize: `${size}px`,
    backgroundColor: bgColor
  })}></div>
`
```

**Supports:** Both camelCase and kebab-case property names!

---

### ⚠️ `unsafeHTML()` - Raw HTML
Render raw HTML (use with caution!).

```typescript
import { html, unsafeHTML } from '@melodicdev/core';

const safeHTML = '<strong>Bold</strong>';
html`
  <div>${unsafeHTML(safeHTML)}</div>
`
```

**Warning:** Only use with trusted content! Can expose XSS vulnerabilities.

---

## Creating Custom Directives

### Simple Directive (Function-based)

```typescript
import { directive } from '@melodicdev/core';

export function myDirective(value: string) {
  return directive((container, previousValue) => {
    container.textContent = value;
    return value; // State for next render
  });
}

// Usage
html`<div>${myDirective('Hello!')}</div>`
```

### Complex Directive (Class-based)

```typescript
import { Directive } from '@melodicdev/core';

class MyDirective extends Directive {
  constructor(private value: string) {
    super();
  }

  render(container: Node, previousState?: any) {
    container.textContent = this.value;
    return { rendered: true };
  }
}

export function myDirective(value: string) {
  return new MyDirective(value);
}
```

---

## Common Patterns

### Tooltip

```typescript
import { directive } from '@melodicdev/core';

export function tooltip(text: string) {
  return directive((container, state) => {
    const el = container as HTMLElement;
    el.title = text; // Simple version
    return text;
  });
}

html`<button ${tooltip('Click me!')}>Hover</button>`
```

### Auto-Focus

```typescript
import { directive } from '@melodicdev/core';

export function autoFocus() {
  return directive((container, focused) => {
    if (!focused) {
      (container as HTMLElement).focus();
      return true;
    }
    return focused;
  });
}

html`<input ${autoFocus()} />`
```

### Fade-In Animation

```typescript
import { directive } from '@melodicdev/core';

export function fadeIn(duration = 300) {
  return directive((container, animated) => {
    if (animated) return true;

    const el = container as HTMLElement;
    el.style.opacity = '0';
    el.style.transition = `opacity ${duration}ms`;

    setTimeout(() => {
      el.style.opacity = '1';
    }, 10);

    return true;
  });
}

html`<div ${fadeIn(500)}>I fade in!</div>`
```

---

## Full Example

```typescript
import {
  html,
  repeat,
  when,
  classMap,
  styleMap
} from '@melodicdev/core';

const template = html`
  <div class="app">
    <!-- Conditional rendering -->
    ${when(isLoading, () => html`
      <div class="spinner">Loading...</div>
    `)}

    <!-- Dynamic list -->
    ${when(!isLoading, () => html`
      <ul>
        ${repeat(
          items,
          item => item.id,
          item => html`
            <li
              class=${classMap({
                completed: item.done,
                urgent: item.priority === 'high'
              })}
              style=${styleMap({
                color: item.color,
                fontSize: '16px'
              })}
            >
              ${item.text}
            </li>
          `
        )}
      </ul>
    `)}
  </div>
`;
```

---

## Performance Tips

1. **Always return state** from your directive for caching
2. **Check previousState** to avoid redundant updates
3. **Use CSS** for animations when possible
4. **Batch DOM operations** in a single directive call

---

## More Info

📖 See [DIRECTIVE_GUIDE.md](./DIRECTIVE_GUIDE.md) for detailed examples and best practices!
