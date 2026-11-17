# Utilities

Standalone helper modules you can import and use independently of any component.

```ts
import { ... } from '@melodicdev/components/utils';
```

- [Positioning](#positioning)
- [Accessibility](#accessibility)
- [Virtual Scrolling](#virtual-scrolling)
- [Style Utilities](#style-utilities)
- [Cross-root ARIA](#cross-root-aria)
- [Watching light-DOM slots](#watching-light-dom-slots)

---

## Positioning

Floating UI primitives used internally by popover, dropdown, and tooltip. You can use them directly to position any arbitrary element.

```ts
import { computePosition, autoUpdate, offset, flip, shift, arrow } from '@melodicdev/components/utils';
import type {
  Placement,
  Side,
  Alignment,
  Position,
  Middleware,
  MiddlewareState,
  ComputePositionConfig,
} from '@melodicdev/components/utils';
```

### `computePosition(reference, floating, config?)`

Calculate the `x`/`y` coordinates to position a floating element next to a reference element. It is synchronous — there is no promise to await.

```ts
const { x, y, placement, middlewareData } = computePosition(
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
| `reference` | `Element` | The anchor element |
| `floating` | `HTMLElement` | The element to position |
| `config.placement` | `Placement` | Preferred side/alignment (default: `'bottom'`) |
| `config.middleware` | `Middleware[]` | Middleware, run in array order (default: `[]`) |

**Returns:** `{ x, y, placement, middlewareData }` — `placement` is the final placement (it differs from the requested one when `flip` changed it) and `middlewareData` is a `Record<string, unknown>` keyed by middleware name.

`x`/`y` are viewport coordinates (they come from `getBoundingClientRect()`), so the floating element should be `position: fixed`.

---

### `autoUpdate(reference, floating, update, options?)`

Watch for scroll, resize, and layout changes then call `update` to reposition. `update` is also called once immediately, so the first paint is positioned. Returns a cleanup function.

```ts
const cleanup = autoUpdate(referenceEl, floatingEl, () => {
  const { x, y } = computePosition(referenceEl, floatingEl, config);
  floatingEl.style.left = `${x}px`;
  floatingEl.style.top  = `${y}px`;
});

// Call when the floating element is hidden
cleanup();
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `ancestorScroll` | `boolean` | `true` | Update when the window or a scrollable ancestor of the reference scrolls (ancestors are found across shadow boundaries) |
| `ancestorResize` | `boolean` | `true` | Update on window resize |
| `elementResize` | `boolean` | `true` | Update when the reference or floating element resizes (`ResizeObserver`) |
| `animationFrame` | `boolean` | `false` | Update on every animation frame |

---

### Middleware

Middleware transforms the position before it is applied.

#### `offset(value?)`

Add space between the reference and floating element. Defaults to `0`.

```ts
offset(8)                            // 8px gap on main axis
offset({ mainAxis: 8, crossAxis: 4 }) // different axes
```

Put `offset` before `flip` in the array: it records its amounts in `middlewareData.offset`, and `flip` re-applies them so the gap survives a flip.

#### `flip(options?)`

Flip to the opposite side when the floating element overflows the viewport on the side it is placed.

```ts
flip()
flip({ fallbackPlacements: ['top', 'right'] })
flip({ padding: 8 }) // treat 8px from the viewport edge as overflow
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `fallbackPlacements` | `Placement[]` | the opposite placement | Placements to try, in order; the first that fits wins. If none fits, the original placement is kept |
| `padding` | `number` | `0` | Distance from the viewport edges that counts as overflow |

#### `shift(options?)`

Slide the floating element along the cross (alignment) axis to keep it inside the viewport — horizontally for `top`/`bottom` placements, vertically for `left`/`right`. The main axis is left to `flip()` by default, so the element is never pulled over its trigger.

```ts
shift()
shift({ padding: 8 }) // keep 8px away from viewport edges
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `padding` | `number` | `0` | Distance to keep from the viewport edges |
| `crossAxis` | `boolean` | `true` | Shift along the alignment axis |
| `mainAxis` | `boolean` | `false` | Also shift along the side axis |

#### `arrow(options)`

Compute the position of an arrow element pointing at the reference. Options: `element` (the arrow element, required) and `padding` (minimum distance from the floating element's edges, default `0`).

```ts
const arrowEl = shadowRoot.querySelector('.arrow') as HTMLElement;

const { middlewareData } = computePosition(ref, float, {
  middleware: [arrow({ element: arrowEl })],
});

// middlewareData values are typed unknown. x is set for top/bottom
// placements and y for left/right; the other is undefined.
const { x: ax, y: ay } = middlewareData.arrow as { x?: number; y?: number };
arrowEl.style.left = ax != null ? `${ax}px` : '';
arrowEl.style.top  = ay != null ? `${ay}px` : '';
```

#### Custom middleware

A middleware is a `{ name, fn }` object. `fn` receives the current `MiddlewareState` (`x`, `y`, `placement`, `rects`, `elements`, `middlewareData`) and may return a partial state to merge; returned `middlewareData` is merged with what earlier middleware recorded.

```ts
const nudge: Middleware = {
  name: 'nudge',
  fn: ({ x }) => ({ x: x + 4, middlewareData: { nudge: { applied: true } } }),
};
```

---

### `Placement` type

```ts
type Placement =
  | 'top' | 'top-start' | 'top-end'
  | 'bottom' | 'bottom-start' | 'bottom-end'
  | 'left' | 'left-start' | 'left-end'
  | 'right' | 'right-start' | 'right-end';

type Side = 'top' | 'right' | 'bottom' | 'left';
type Alignment = 'start' | 'center' | 'end';
```

---

## Accessibility

### Focus Trap

Keep Tab / Shift+Tab cycling inside a container — used internally by `ml-popover`. Focusable elements slotted into the container are included.

```ts
import { focusTrap, createFocusTrap } from '@melodicdev/components/utils';
import type { FocusTrap, FocusTrapOptions, FocusTrapDeactivateOptions } from '@melodicdev/components/utils';
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

// Deactivate without moving focus (e.g. the user already focused something else)
trap.deactivate({ returnFocus: false });
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `initialFocus` | `HTMLElement \| null` | `null` | Element to focus when trap activates |
| `returnFocus` | `HTMLElement \| null` | `null` | Element to return focus to on deactivate. When not set, focus returns to the element that was focused when the trap activated |
| `autoFocus` | `boolean` | `true` | Auto-focus first focusable element if `initialFocus` not provided |

`deactivate(options?)` takes `FocusTrapDeactivateOptions`: `{ returnFocus?: boolean }` (default `true`). Pass `false` to leave focus where it is.

#### `getDeepActiveElement()` / `isDeepFocusWithin(container)`

```ts
import { getDeepActiveElement, isDeepFocusWithin } from '@melodicdev/components/utils';
```

`document.activeElement` stops at the outermost shadow host. `getDeepActiveElement()` descends through nested shadow roots and returns the element that actually has focus (`Element | null`). `isDeepFocusWithin(container)` returns `true` when that element is `container` or inside it, crossing shadow boundaries.

```ts
// Only hand focus back to the trigger if it was still inside the overlay
trap.deactivate({ returnFocus: isDeepFocusWithin(overlayEl) });
```

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
| `getFocusableElements(container, options?)` | `HTMLElement[]` | All interactive elements, excluding hidden ones. Pass `{ deep: true }` to also descend into nested shadow roots and follow `<slot>`s (composed-tree order) — needed to find the control inside an `<ml-input>` or `<ml-button>` |
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

Returns `true` if the most recent interaction was a keyboard event. Tracking starts the first time `isFocusVisible()` or `focusVisible()` is called, so the first call reports `false`.

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

Send a message to the global live region for the given priority (created lazily, appended to `<body>`; one region per politeness level).

```ts
announce('Item saved successfully');         // polite (waits for silence)
announce('Error: required field', 'assertive'); // interrupts immediately
```

Messages are queued per politeness level: rapid successive calls are announced in order rather than the newest call cancelling earlier ones. Polite and assertive announcements use separate regions, so they never clobber each other.

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
  onUpdate: (start, end) => {       // render rows.slice(start, end)
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
| `onUpdate` | `(startIndex, endIndex) => void` | — | Called on every scroll, resize and `invalidate()` with the range to render; `endIndex` is exclusive |
| `enabled` | `() => boolean` | `() => true` | Return `false` to render all rows (`onUpdate(0, itemCount())`) |
| `buffer` | `number` | `3` | Extra rows rendered above and below the viewport |

> The viewport element you attach to must have a constrained height and scroll (`overflow-y: auto`) for virtual scrolling to work: the visible range is computed from its `clientHeight` and `scrollTop`.

---

## Style Utilities

Reusable CSS strings intended for use inside Shadow DOM components.

```ts
import {
  resetStyles,
  visuallyHiddenStyles,
  componentBaseStyles,
} from '@melodicdev/components/utils';
```

### `resetStyles`

Box-sizing reset, zeroed margin/padding, and browser default normalization for buttons, inputs, anchors, and images.

```ts
import { css } from '@melodicdev/core';

const styles = () => css`
  ${resetStyles}

  /* component-specific rules below */
`;
```

### `visuallyHiddenStyles`

Defines a `.visually-hidden` class that hides an element visually while keeping it accessible to screen readers (it becomes visible again on `:focus`/`:active`). It is a complete rule set, not a list of declarations, so include it at the top level of your styles and put the class on the element:

```ts
const styles = () => css`
  ${visuallyHiddenStyles}
`;

// template
html`<span class="visually-hidden">Loading</span>`;
```

### `componentBaseStyles`

Rules for `:host` — sets `font-family: var(--ml-font-sans)` and `box-sizing: border-box` (inherited by everything inside), and provides default `:host(:focus-visible)`, `:host([disabled])`, and `:host([hidden])` states.

## Cross-root ARIA

`aria-describedby`, `aria-labelledby` and `aria-activedescendant` are IDREFs, and an IDREF
only resolves **within the same tree**. A component whose description lives in its shadow
root cannot point a light-DOM trigger at it: the attribute is set, resolves to nothing, and
the content is never announced.

```typescript
import {
	setCrossRootDescription,
	setCrossRootLabel,
	setCrossRootActiveDescendant,
	clearCrossRootDescription,
	getFocusableControl,
	supportsAriaElementReferences
} from '@melodicdev/components/utils';

// Describe a light-DOM trigger with an element inside this shadow root.
setCrossRootDescription(trigger, [contentElement]);

// Clear it again.
clearCrossRootDescription(trigger);
```

The ARIA element-reference properties (`ariaDescribedByElements` and friends) relax this,
but only in **one direction**: the referenced element must be in the same tree as the
referencing element or in one of its shadow-including *ancestor* trees. A control inside a
shadow root can point **out** at light-DOM content; a light-DOM element cannot point **in**
at something inside a shadow root — the browser silently drops that reference.

These helpers use an element reference when it will be honoured and otherwise copy the
text onto the element (`aria-description` / `aria-label`). A slotted trigger described by
content in your shadow root is the inward case, so it always gets the text — call the
helper again when that text changes.

| Function | Description |
|----------|-------------|
| `setCrossRootDescription(target, describers)` | Describe `target` with the `describers` elements. An empty array clears it. Fallback: `aria-description` |
| `clearCrossRootDescription(target)` | Same as `setCrossRootDescription(target, [])` |
| `setCrossRootLabel(target, labels)` | Label `target` with the `labels` elements. An empty array clears it. Fallback: `aria-label` |
| `setCrossRootActiveDescendant(target, active)` | Point `target` at the active option (`Element \| null`). Fallback: `aria-activedescendant` set to the option's `id` |
| `supportsAriaElementReferences()` | `true` when the browser supports the element-reference properties |
| `canReferenceElement(from, to)` | `true` when an element reference from `from` to `to` will be honoured (`to` is in `from`'s tree or an ancestor tree) |

`getFocusableControl(element)` returns the node that actually takes focus for a possibly
composite control — the `<button>` inside an `<ml-button>`, for instance. ARIA state must
sit there, not on the wrapper host.

## Watching light-DOM slots

`watchSlotPresence` (from `@melodicdev/components/functions`, see
[Directives & Functions](./directives-and-functions.md#watchslotpresenceshadow-onchange))
listens on shadow `<slot>` elements, which only works when those slots
are always rendered. A component that renders a slot conditionally
(`${when(hasSearch, …)}`) has a chicken-and-egg problem: the slot that would fire
`slotchange` exists only once the flag is already true.

```typescript
import { watchLightSlots, hasLightSlot } from '@melodicdev/components/utils';

public onCreate(): void {
	this._cleanup = watchLightSlots(this.elementRef, () => {
		this.hasSearch = hasLightSlot(this.elementRef, 'search');
	});
}

public onDestroy(): void {
	this._cleanup?.();
}
```

`watchLightSlots(host, onChange)` observes the host's light DOM and calls `onChange` once
immediately and again whenever a direct child is added, removed, or has its `slot` attribute
changed. It returns a disconnect function. `hasLightSlot(host, slotName)` returns `true` when
`host` has a direct child with `slot="slotName"`.
