# Utilities

Standalone helper modules you can import and use independently of any component.

```ts
import { ... } from '@melodicdev/components/utils';
```

- [Positioning](#positioning)
- [Accessibility](#accessibility)
- [Virtual Scrolling](#virtual-scrolling)
- [Style Utilities](#style-utilities)

---

## Positioning

Floating UI primitives used internally by popover, dropdown, and tooltip. You can use them directly to position any arbitrary element.

```ts
import { computePosition, autoUpdate, offset, flip, shift, arrow } from '@melodicdev/components/utils';
import type { Placement } from '@melodicdev/components/utils';
```

### `computePosition(reference, floating, config)`

Calculate the `x`/`y` coordinates to position a floating element next to a reference element.

```ts
const { x, y, placement, middlewareData } = await computePosition(
  referenceEl,
  floatingEl,
  {
    placement: 'bottom-start',
    middleware: [offset(8), flip(), shift({ padding: 8 })],
  }
);

floatingEl.style.left = `${x}px`;
floatingEl.style.top  = `${y}px`;
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `reference` | `HTMLElement` | The anchor element |
| `floating` | `HTMLElement` | The element to position |
| `config.placement` | `Placement` | Preferred side/alignment (default: `'bottom'`) |
| `config.middleware` | `Middleware[]` | Array of middleware functions |

**Returns:** `Promise<{ x, y, placement, middlewareData }>`

---

### `autoUpdate(reference, floating, update, options?)`

Watch for scroll, resize, and layout changes then call `update` to reposition. Returns a cleanup function.

```ts
const cleanup = autoUpdate(referenceEl, floatingEl, () => {
  computePosition(referenceEl, floatingEl, config).then(applyStyles);
});

// Call when the floating element is hidden
cleanup();
```

---

### Middleware

Middleware transforms the position before it is applied.

#### `offset(value)`

Add space between the reference and floating element.

```ts
offset(8)                            // 8px gap on main axis
offset({ mainAxis: 8, crossAxis: 4 }) // different axes
```

#### `flip(options?)`

Flip to the opposite side when the preferred placement overflows the viewport.

```ts
flip()
flip({ fallbackPlacements: ['top', 'right'] })
```

#### `shift(options?)`

Slide along the main axis to keep the floating element visible.

```ts
shift()
shift({ padding: 8 }) // keep 8px away from viewport edges
```

#### `arrow(options)`

Compute the position of an arrow element pointing at the reference.

```ts
const arrowEl = shadowRoot.querySelector('.arrow') as HTMLElement;

const { middlewareData } = await computePosition(ref, float, {
  middleware: [arrow({ element: arrowEl })],
});

const { x: ax, y: ay } = middlewareData.arrow!;
arrowEl.style.left = ax != null ? `${ax}px` : '';
arrowEl.style.top  = ay != null ? `${ay}px` : '';
```

---

### `Placement` type

```ts
type Placement =
  | 'top' | 'top-start' | 'top-end'
  | 'bottom' | 'bottom-start' | 'bottom-end'
  | 'left' | 'left-start' | 'left-end'
  | 'right' | 'right-start' | 'right-end';
```

---

## Accessibility

### Focus Trap

Prevent keyboard focus from leaving a container — used internally by dialogs and drawers.

```ts
import { focusTrap, createFocusTrap } from '@melodicdev/components/utils';
import type { FocusTrap, FocusTrapOptions } from '@melodicdev/components/utils';
```

#### `focusTrap(container, options?)`

One-shot convenience. Activates immediately and returns a deactivate function.

```ts
const deactivate = focusTrap(modalEl);

// When modal closes:
deactivate();
```

#### `createFocusTrap(container, options?)`

More control — returns an object with `activate()`, `deactivate()`, and `isActive()`.

```ts
const trap = createFocusTrap(dialogEl, {
  initialFocus: dialogEl.querySelector('input'), // focus this on open
  returnFocus: triggerButton,                     // focus this on close
  autoFocus: true,                               // default: true
});

trap.activate();
trap.isActive(); // true
trap.deactivate();
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `initialFocus` | `HTMLElement \| null` | `null` | Element to focus when trap activates |
| `returnFocus` | `HTMLElement \| null` | `null` | Element to return focus to on deactivate |
| `autoFocus` | `boolean` | `true` | Auto-focus first focusable element if `initialFocus` not provided |

---

### Focus Queries

Utilities for querying and moving focus within a container.

```ts
import {
  getFocusableElements,
  getFirstFocusable,
  getLastFocusable,
  focusFirst,
  focusLast,
} from '@melodicdev/components/utils';
```

| Function | Returns | Description |
|----------|---------|-------------|
| `getFocusableElements(container)` | `HTMLElement[]` | All interactive elements, excluding hidden ones |
| `getFirstFocusable(container)` | `HTMLElement \| null` | First focusable element |
| `getLastFocusable(container)` | `HTMLElement \| null` | Last focusable element |
| `focusFirst(container)` | `boolean` | Focus first; returns `true` on success |
| `focusLast(container)` | `boolean` | Focus last; returns `true` on success |

---

### Focus Visible

Detect whether the current focus came from keyboard navigation.

```ts
import { focusVisible, isFocusVisible } from '@melodicdev/components/utils';
```

#### `isFocusVisible()`

Returns `true` if the most recent interaction was a keyboard event.

```ts
element.addEventListener('focus', () => {
  if (isFocusVisible()) {
    element.classList.add('show-ring');
  }
});
```

#### `focusVisible(element, className?)`

Automatically adds/removes a class when the element is keyboard-focused. Returns a cleanup function.

```ts
const cleanup = focusVisible(buttonEl);              // adds 'focus-visible'
const cleanup = focusVisible(buttonEl, 'is-focused'); // custom class name

// Remove listeners:
cleanup();
```

---

### Live Regions

Announce messages to screen readers without moving focus.

```ts
import { announce, createLiveRegion } from '@melodicdev/components/utils';
```

#### `announce(message, priority?)`

Send a message to the global singleton live region (created lazily, appended to `<body>`).

```ts
announce('Item saved successfully');         // polite (waits for silence)
announce('Error: required field', 'assertive'); // interrupts immediately
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `message` | `string` | — | Text to announce |
| `priority` | `'polite' \| 'assertive'` | `'polite'` | Screen reader priority |

#### `createLiveRegion(options?)`

Create a custom live region element you manage yourself. You must append it to the DOM.

```ts
const region = createLiveRegion({ id: 'my-region', priority: 'assertive', atomic: true });
document.body.appendChild(region);

region.textContent = 'Upload complete';
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `id` | `string` | — | `id` attribute on the element |
| `priority` | `'polite' \| 'assertive'` | `'polite'` | `aria-live` value |
| `atomic` | `boolean` | `true` | `aria-atomic` value |

---

## Virtual Scrolling

Efficiently render large lists by only mounting visible rows in the DOM.

```ts
import { VirtualScroller } from '@melodicdev/components/utils';
import type { VirtualScrollOptions } from '@melodicdev/components/utils';
```

`ml-table` and `ml-data-grid` use this internally via their `virtual` attribute. Import it directly if you need virtual scrolling in a custom component.

### `VirtualScroller`

```ts
const scroller = new VirtualScroller();

// Attach to a scrollable viewport
scroller.attach(viewportEl, {
  rowHeight: () => 44,              // row height in px (can be dynamic)
  itemCount: () => rows.length,     // total number of items
  onUpdate: (start, end) => {
    this.startIndex = start;
    this.endIndex   = end;
  },
  enabled: () => this.virtual,      // optional: set false to show all rows
  buffer: 3,                        // optional: overscan rows (default: 3)
});

// After data changes (sort, filter, etc.)
scroller.invalidate();

// Cleanup
scroller.detach();
```

| Method | Description |
|--------|-------------|
| `attach(viewport, options)` | Start observing. Uses `ResizeObserver` + scroll listener. |
| `detach()` | Remove all observers and listeners. Call in `onDestroy`. |
| `invalidate()` | Force a recalculation — call after data changes. |

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `rowHeight` | `() => number` | — | Function returning the row height in px |
| `itemCount` | `() => number` | — | Function returning total item count |
| `onUpdate` | `(start, end) => void` | — | Called when the visible window changes |
| `enabled` | `() => boolean` | `() => true` | Return `false` to render all rows |
| `buffer` | `number` | `3` | Extra rows rendered above and below the viewport |

> The parent element must have a defined height and `overflow-y: auto` for virtual scrolling to work.

---

## Style Utilities

Reusable CSS strings intended for use inside Shadow DOM components.

```ts
import {
  resetStyles,
  visuallyHiddenStyles,
  componentBaseStyles,
  focusRingStyles,
  interactiveStyles,
} from '@melodicdev/components/utils';
```

### `resetStyles`

Box-sizing reset + browser default normalization for buttons, inputs, anchors, and images.

```ts
import { css } from '@melodicdev/core';

const styles = () => css`
  ${resetStyles}

  /* component-specific rules below */
`;
```

### `visuallyHiddenStyles`

Hides an element visually while keeping it accessible to screen readers.

```ts
const styles = () => css`
  .sr-only {
    ${visuallyHiddenStyles}
  }
`;
```

### `componentBaseStyles`

Applied to `:host` — inherits font, sets `box-sizing: border-box`, and provides default `:focus-visible`, `[disabled]`, and `[hidden]` states.

### `focusRingStyles`

Mixin for interactive elements (buttons, inputs): hides the default outline and shows the design-token focus ring on `:focus-visible`.

```ts
const styles = () => css`
  button {
    ${focusRingStyles}
  }
`;
```

### `interactiveStyles`

Base cursor, user-select, and disabled-state styles for clickable elements.

```ts
const styles = () => css`
  .my-clickable {
    ${interactiveStyles}
  }
`;
```
