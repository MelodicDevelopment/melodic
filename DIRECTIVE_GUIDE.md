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

## Class-Based Directive Examples

Class-based directives are ideal when you need:
- **Multiple helper methods** for better organization
- **Constructor parameters** to configure the directive
- **Private state** and encapsulation
- **Complex logic** that benefits from OOP structure

### Example 1: Simple Text Transform (Class-Based)

```typescript
import { Directive } from 'melodic';
import type { DirectiveResult } from 'melodic';

type TransformType = 'uppercase' | 'lowercase' | 'title' | 'reverse';

class TextTransformDirective extends Directive {
  constructor(private text: string, private transform: TransformType) {
    super();
  }

  render(container: Node, previousState?: string): string {
    const element = container as HTMLElement;
    const transformed = this.applyTransform();

    // Only update if changed
    if (previousState === transformed) {
      return previousState;
    }

    element.textContent = transformed;
    return transformed;
  }

  private applyTransform(): string {
    switch (this.transform) {
      case 'uppercase':
        return this.text.toUpperCase();
      case 'lowercase':
        return this.text.toLowerCase();
      case 'title':
        return this.toTitleCase(this.text);
      case 'reverse':
        return this.text.split('').reverse().join('');
      default:
        return this.text;
    }
  }

  private toTitleCase(str: string): string {
    return str.replace(/\w\S*/g, (txt) =>
      txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase()
    );
  }
}

export function textTransform(text: string, transform: TransformType): DirectiveResult {
  return new TextTransformDirective(text, transform);
}

// Usage:
html`
  <p>${textTransform('hello world', 'title')}</p>
  <!-- Renders: Hello World -->
`
```

### Example 2: Configurable Highlight Directive

```typescript
import { Directive } from 'melodic';
import type { DirectiveResult } from 'melodic';

interface HighlightOptions {
  color?: string;
  backgroundColor?: string;
  duration?: number;
}

class HighlightDirective extends Directive {
  private options: Required<HighlightOptions>;

  constructor(options: HighlightOptions = {}) {
    super();
    this.options = {
      color: options.color || '#000',
      backgroundColor: options.backgroundColor || '#ffeb3b',
      duration: options.duration || 2000
    };
  }

  render(container: Node, previousState?: number): number {
    const element = container as HTMLElement;

    // Apply highlight
    this.applyStyles(element);

    // Remove highlight after duration
    setTimeout(() => {
      this.removeStyles(element);
    }, this.options.duration);

    return Date.now();
  }

  private applyStyles(element: HTMLElement): void {
    element.style.transition = 'all 0.3s ease';
    element.style.color = this.options.color;
    element.style.backgroundColor = this.options.backgroundColor;
  }

  private removeStyles(element: HTMLElement): void {
    element.style.color = '';
    element.style.backgroundColor = '';
  }
}

export function highlight(options?: HighlightOptions): DirectiveResult {
  return new HighlightDirective(options);
}

// Usage:
html`
  <div ${highlight({ backgroundColor: '#4caf50', duration: 3000 })}>
    This will be highlighted!
  </div>
`
```

### Example 3: Debounced Input Handler

```typescript
import { Directive } from 'melodic';
import type { DirectiveResult } from 'melodic';

interface DebounceState {
  timeoutId: number | null;
  handler: (e: Event) => void;
}

class DebounceDirective extends Directive {
  constructor(
    private callback: (value: string) => void,
    private delay: number = 300
  ) {
    super();
  }

  render(container: Node, previousState?: DebounceState): DebounceState {
    const element = container as HTMLInputElement;

    // First render - setup event listener
    if (!previousState) {
      const handler = (e: Event) => {
        this.handleInput(e as InputEvent, element);
      };

      element.addEventListener('input', handler);

      return {
        timeoutId: null,
        handler
      };
    }

    // Callback or delay changed - remove old listener and add new one
    if (previousState.handler) {
      element.removeEventListener('input', previousState.handler);

      const handler = (e: Event) => {
        this.handleInput(e as InputEvent, element);
      };

      element.addEventListener('input', handler);

      return {
        timeoutId: previousState.timeoutId,
        handler
      };
    }

    return previousState;
  }

  private handleInput(event: InputEvent, element: HTMLInputElement): void {
    const value = element.value;

    // Clear existing timeout
    if ((event.target as any).__debounceTimeout) {
      clearTimeout((event.target as any).__debounceTimeout);
    }

    // Set new timeout
    (event.target as any).__debounceTimeout = setTimeout(() => {
      this.callback(value);
    }, this.delay);
  }
}

export function debounce(
  callback: (value: string) => void,
  delay?: number
): DirectiveResult {
  return new DebounceDirective(callback, delay);
}

// Usage in component:
html`
  <input
    type="text"
    ${debounce((value) => console.log('Debounced value:', value), 500)}
    placeholder="Type something..."
  />
`
```

### Example 4: Complex Drag-and-Drop Directive

This shows the power of class-based directives with multiple helper methods:

```typescript
import { Directive } from 'melodic';
import type { DirectiveResult } from 'melodic';

interface DragState {
  isDragging: boolean;
  startX: number;
  startY: number;
  offsetX: number;
  offsetY: number;
  handlers: {
    mouseDown: (e: MouseEvent) => void;
    mouseMove: (e: MouseEvent) => void;
    mouseUp: (e: MouseEvent) => void;
  };
}

interface DragOptions {
  onDragStart?: (element: HTMLElement) => void;
  onDrag?: (element: HTMLElement, x: number, y: number) => void;
  onDragEnd?: (element: HTMLElement) => void;
  handle?: string; // CSS selector for drag handle
  containment?: 'parent' | 'window';
}

class DraggableDirective extends Directive {
  private options: DragOptions;
  private state: DragState | null = null;

  constructor(options: DragOptions = {}) {
    super();
    this.options = options;
  }

  render(container: Node, previousState?: DragState): DragState {
    const element = container as HTMLElement;

    // First render - setup
    if (!previousState) {
      element.style.position = 'absolute';
      element.style.cursor = 'move';

      const handlers = {
        mouseDown: (e: MouseEvent) => this.handleMouseDown(e, element),
        mouseMove: (e: MouseEvent) => this.handleMouseMove(e, element),
        mouseUp: (e: MouseEvent) => this.handleMouseUp(e, element)
      };

      // Setup drag handle or use entire element
      const dragHandle = this.options.handle
        ? element.querySelector(this.options.handle) as HTMLElement
        : element;

      if (dragHandle) {
        dragHandle.addEventListener('mousedown', handlers.mouseDown);
      }

      this.state = {
        isDragging: false,
        startX: 0,
        startY: 0,
        offsetX: 0,
        offsetY: 0,
        handlers
      };

      return this.state;
    }

    this.state = previousState;
    return previousState;
  }

  private handleMouseDown(e: MouseEvent, element: HTMLElement): void {
    if (!this.state) return;

    e.preventDefault();

    const rect = element.getBoundingClientRect();
    this.state.isDragging = true;
    this.state.startX = e.clientX - rect.left;
    this.state.startY = e.clientY - rect.top;

    // Add styles during drag
    element.style.opacity = '0.8';
    element.style.zIndex = '1000';

    // Attach global listeners
    document.addEventListener('mousemove', this.state.handlers.mouseMove);
    document.addEventListener('mouseup', this.state.handlers.mouseUp);

    // Call user callback
    this.options.onDragStart?.(element);
  }

  private handleMouseMove(e: MouseEvent, element: HTMLElement): void {
    if (!this.state || !this.state.isDragging) return;

    e.preventDefault();

    let newX = e.clientX - this.state.startX;
    let newY = e.clientY - this.state.startY;

    // Apply containment constraints
    if (this.options.containment === 'parent') {
      const parent = element.parentElement;
      if (parent) {
        const bounds = this.calculateBounds(element, parent);
        newX = Math.max(bounds.minX, Math.min(newX, bounds.maxX));
        newY = Math.max(bounds.minY, Math.min(newY, bounds.maxY));
      }
    }

    // Update position
    element.style.left = `${newX}px`;
    element.style.top = `${newY}px`;

    // Call user callback
    this.options.onDrag?.(element, newX, newY);
  }

  private handleMouseUp(e: MouseEvent, element: HTMLElement): void {
    if (!this.state) return;

    this.state.isDragging = false;

    // Remove global listeners
    document.removeEventListener('mousemove', this.state.handlers.mouseMove);
    document.removeEventListener('mouseup', this.state.handlers.mouseUp);

    // Restore styles
    element.style.opacity = '1';
    element.style.zIndex = '';

    // Call user callback
    this.options.onDragEnd?.(element);
  }

  private calculateBounds(
    element: HTMLElement,
    parent: HTMLElement
  ): { minX: number; maxX: number; minY: number; maxY: number } {
    const parentRect = parent.getBoundingClientRect();
    const elementRect = element.getBoundingClientRect();

    return {
      minX: 0,
      maxX: parentRect.width - elementRect.width,
      minY: 0,
      maxY: parentRect.height - elementRect.height
    };
  }
}

export function draggable(options?: DragOptions): DirectiveResult {
  return new DraggableDirective(options);
}

// Usage in component:
html`
  <div ${draggable({
    containment: 'parent',
    onDragStart: (el) => console.log('Started dragging'),
    onDrag: (el, x, y) => console.log(`Position: ${x}, ${y}`),
    onDragEnd: (el) => console.log('Stopped dragging')
  })}>
    <div class="drag-handle">📌 Drag me!</div>
    <div class="content">Draggable content here</div>
  </div>
`
```

### When to Use Class-Based vs Function-Based

**Use Class-Based (`extends Directive`) when:**
- You need multiple helper methods for organization
- Complex state management with private fields
- Constructor configuration is cleaner than closure parameters
- You prefer object-oriented patterns

**Use Function-Based (`directive()`) when:**
- Simple, straightforward logic
- Minimal state tracking
- You prefer functional programming style
- Quick prototyping

**Key insight:** Both approaches are equally powerful. Choose based on complexity and personal preference. All built-in Melodic directives use the function-based approach, but class-based can be cleaner for complex scenarios like the drag-and-drop example above.

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
