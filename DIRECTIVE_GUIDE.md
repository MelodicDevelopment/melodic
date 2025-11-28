# Melodic Directive Guide

## What Are Directives?

Directives are reusable, stateful DOM manipulation functions that extend the template system with custom behaviors. They're perfect for:

- **Conditional rendering** (show/hide based on conditions)
- **List rendering** (efficient keyed lists)
- **Dynamic attributes** (classes, styles, etc.)
- **Animations** (enter/leave transitions)
- **Custom DOM behaviors** (tooltips, drag-and-drop, etc.)

---

## Quick Start

### Using Built-in Directives

```typescript
import { html, repeat, when, classMap, styleMap } from 'melodic';

// Keyed list rendering
html`
  <ul>
    ${repeat(items, item => item.id, item => html`
      <li>${item.name}</li>
    `)}
  </ul>
`

// Conditional rendering
html`
  ${when(isLoggedIn, () => html`<div>Welcome!</div>`)}
`

// Dynamic classes
html`
  <div class=${classMap({ active: isActive, disabled: !enabled })}></div>
`

// Dynamic styles
html`
  <div style=${styleMap({ color: textColor, fontSize: `${size}px` })}></div>
`
```

---

## Creating Your Own Directives

There are **two ways** to create directives:

### 1. Simple Function Directive (Recommended for beginners)

Use the `directive()` helper for simple use cases:

```typescript
import { directive } from 'melodic';

export function myDirective(value: string) {
  return directive((container, previousValue) => {
    // Your logic here
    container.textContent = value;

    // Return state for next render
    return value;
  });
}
```

### 2. Class-Based Directive (For complex logic)

Extend the `Directive` base class for more control:

```typescript
import { Directive } from 'melodic';

class MyDirective extends Directive {
  constructor(private value: string) {
    super();
  }

  render(container: Node, previousState?: any): any {
    // Your logic here
    container.textContent = this.value;

    // Return state for next render
    return { someState: true };
  }
}

export function myDirective(value: string) {
  return new MyDirective(value);
}
```

---

## Directive Anatomy

Every directive has two key parts:

### 1. The `render()` Method

This is called every time the template updates.

**Parameters:**
- `container: Node` - The DOM node where your directive is placed
- `previousState?: any` - State you returned from the previous render

**Return value:**
- Any value you want to receive as `previousState` on the next render
- Use this to track what's changed and avoid unnecessary DOM operations

**Example:**
```typescript
render(container: Node, previousState?: string) {
  const element = container as HTMLElement;

  // Only update if value changed (performance optimization)
  if (previousState === this.value) {
    return previousState;
  }

  element.textContent = this.value;
  return this.value; // Will be previousState next time
}
```

### 2. The Factory Function

This is what users call in their templates.

```typescript
export function myDirective(value: string) {
  return directive((container, previousState) => {
    // render logic
  });
}
```

---

## Example 1: Simple Text Directive

Let's create a directive that formats text in different ways:

```typescript
import { directive, type DirectiveResult } from 'melodic';

type TextFormat = 'uppercase' | 'lowercase' | 'capitalize';

export function formatText(text: string, format: TextFormat): DirectiveResult {
  return directive((container, previousFormat) => {
    const element = container as HTMLElement;

    let formatted = text;
    switch (format) {
      case 'uppercase':
        formatted = text.toUpperCase();
        break;
      case 'lowercase':
        formatted = text.toLowerCase();
        break;
      case 'capitalize':
        formatted = text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
        break;
    }

    element.textContent = formatted;
    return format;
  });
}

// Usage:
html`
  <p>${formatText('hello world', 'uppercase')}</p>
  <!-- Renders: HELLO WORLD -->
`
```

---

## Example 2: Tooltip Directive

A more complex directive with state management:

```typescript
import { directive, type DirectiveResult } from 'melodic';

interface TooltipState {
  tooltipElement: HTMLDivElement | null;
  showHandler: () => void;
  hideHandler: () => void;
}

export function tooltip(text: string): DirectiveResult {
  return directive((container, previousState?: TooltipState) => {
    const element = container as HTMLElement;

    // First render - setup
    if (!previousState) {
      const tooltipEl = document.createElement('div');
      tooltipEl.className = 'tooltip';
      tooltipEl.textContent = text;
      tooltipEl.style.cssText = `
        position: absolute;
        background: #333;
        color: white;
        padding: 5px 10px;
        border-radius: 4px;
        display: none;
        z-index: 1000;
      `;

      document.body.appendChild(tooltipEl);

      const showHandler = () => {
        const rect = element.getBoundingClientRect();
        tooltipEl.style.left = `${rect.left}px`;
        tooltipEl.style.top = `${rect.bottom + 5}px`;
        tooltipEl.style.display = 'block';
      };

      const hideHandler = () => {
        tooltipEl.style.display = 'none';
      };

      element.addEventListener('mouseenter', showHandler);
      element.addEventListener('mouseleave', hideHandler);

      return { tooltipElement: tooltipEl, showHandler, hideHandler };
    }

    // Update text if changed
    if (previousState.tooltipElement) {
      previousState.tooltipElement.textContent = text;
    }

    return previousState;
  });
}

// Usage:
html`
  <button ${tooltip('Click me!')}>Hover</button>
`
```

---

## Example 3: Fade-In Animation Directive

Directive that animates elements when they appear:

```typescript
import { directive, type DirectiveResult } from 'melodic';

interface FadeInOptions {
  duration?: number;
  delay?: number;
}

export function fadeIn(options: FadeInOptions = {}): DirectiveResult {
  return directive((container, hasAnimated?: boolean) => {
    if (hasAnimated) return true;

    const element = container as HTMLElement;
    const duration = options.duration || 300;
    const delay = options.delay || 0;

    element.style.opacity = '0';
    element.style.transition = `opacity ${duration}ms ease-in`;

    setTimeout(() => {
      element.style.opacity = '1';
    }, delay);

    return true; // Mark as animated
  });
}

// Usage:
html`
  <div ${fadeIn({ duration: 500, delay: 100 })}>
    I fade in!
  </div>
`
```

---

## Example 4: Auto-Focus Directive

Simple directive to focus an input when it appears:

```typescript
import { directive, type DirectiveResult } from 'melodic';

export function autoFocus(): DirectiveResult {
  return directive((container, hasFocused?: boolean) => {
    if (!hasFocused) {
      (container as HTMLElement).focus();
      return true;
    }
    return hasFocused;
  });
}

// Usage:
html`
  <input type="text" ${autoFocus()} />
`
```

---

## Advanced Pattern: Stateful Directive with Cleanup

For directives that need cleanup (event listeners, timers, etc.):

```typescript
import { directive, type DirectiveResult } from 'melodic';

interface ScrollSpyState {
  observer: IntersectionObserver;
  callback: (isVisible: boolean) => void;
}

export function scrollSpy(callback: (isVisible: boolean) => void): DirectiveResult {
  return directive((container, previousState?: ScrollSpyState) => {
    const element = container as HTMLElement;

    // First render - setup observer
    if (!previousState) {
      const observer = new IntersectionObserver(
        (entries) => {
          callback(entries[0].isIntersecting);
        },
        { threshold: 0.5 }
      );

      observer.observe(element);

      return { observer, callback };
    }

    // Callback changed - disconnect old observer
    if (previousState.callback !== callback) {
      previousState.observer.disconnect();

      const observer = new IntersectionObserver(
        (entries) => {
          callback(entries[0].isIntersecting);
        },
        { threshold: 0.5 }
      );

      observer.observe(element);
      return { observer, callback };
    }

    return previousState;
  });
}

// Note: You'd need component lifecycle cleanup for full cleanup on destroy
```

---

## Best Practices

### ✅ DO:

1. **Return state from render()** to track changes
   ```typescript
   render(container, previousState) {
     // ... logic ...
     return { myState: value };
   }
   ```

2. **Check previous state to avoid unnecessary work**
   ```typescript
   if (previousState === currentValue) {
     return previousState; // Skip update
   }
   ```

3. **Use descriptive names** like `tooltip()`, `fadeIn()`, `autoFocus()`

4. **Document your directives** with JSDoc comments

5. **Type your state** with interfaces for clarity
   ```typescript
   interface MyState {
     count: number;
   }
   ```

### ❌ DON'T:

1. **Don't mutate the container directly if you can help it**
   - Let the template system manage the structure
   - Directives should enhance, not replace

2. **Don't forget to clean up resources**
   - Remove event listeners when no longer needed
   - Disconnect observers
   - Clear timeouts/intervals

3. **Don't create new functions inside render()**
   - This causes event listeners to be re-attached every render
   ```typescript
   // ❌ Bad
   element.addEventListener('click', () => console.log('click'));

   // ✅ Good
   if (!previousState) {
     const handler = () => console.log('click');
     element.addEventListener('click', handler);
     return { handler };
   }
   ```

4. **Don't access parent/child nodes unnecessarily**
   - Work with the container node you're given

---

## Performance Tips

1. **Always check previousState** before doing expensive operations
2. **Return early** if nothing changed
3. **Batch DOM updates** when possible
4. **Use CSS for animations** instead of JavaScript when you can
5. **Cache expensive calculations** in state

---

## Testing Your Directive

```typescript
import { html, render } from 'melodic';
import { myDirective } from './my-directive';

// Create a test container
const container = document.createElement('div');

// Render with your directive
const template = html`
  <div ${myDirective('test value')}></div>
`;

render(template, container);

// Assert expected DOM
expect(container.querySelector('div')?.textContent).toBe('test value');

// Test updates
const updated = html`
  <div ${myDirective('new value')}></div>
`;

render(updated, container);
expect(container.querySelector('div')?.textContent).toBe('new value');
```

---

## Contributing Your Directive

Want to share your directive with the community? Here's how:

1. **Create the directive** in `src/template/directives/`
2. **Add tests** to verify it works
3. **Document it** with JSDoc comments and examples
4. **Export it** from `src/index.ts`
5. **Submit a PR** with:
   - Your directive code
   - Tests
   - Example usage in the README
   - Updated DIRECTIVE_GUIDE.md if needed

---

## Built-in Directives Reference

### `repeat()`
Keyed list rendering for optimal DOM updates.

```typescript
repeat(items, keyFn, templateFn)
```

### `when()`
Conditional rendering - removes from DOM when false.

```typescript
when(condition, () => html`...`)
```

### `classMap()`
Dynamic CSS classes.

```typescript
classMap({ active: true, disabled: false })
```

### `styleMap()`
Dynamic inline styles.

```typescript
styleMap({ color: 'red', fontSize: '16px' })
```

### `unsafeHTML()`
⚠️ Render raw HTML (use with caution!)

```typescript
unsafeHTML('<strong>Bold</strong>')
```

---

## Need Help?

- Check the examples in `src/template/directives/`
- Look at how built-in directives are implemented
- Ask in GitHub Discussions
- Submit an issue if you find bugs

Happy directive creating! 🎨
