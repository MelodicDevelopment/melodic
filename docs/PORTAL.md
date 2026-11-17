# Melodic Portal

A directive that teleports elements to a different location in the DOM, useful for modals, tooltips, dropdowns, and notifications.

## Why Use Portals?

When rendering modals, tooltips, or dropdowns inside a component, they can be affected by:
- Parent `overflow: hidden` clipping the content
- `z-index` stacking context issues
- CSS transforms creating new stacking contexts

Portals solve this by rendering the content at a different location (typically `document.body`), escaping these constraints.

## Installation

The directive is built in. It registers itself under the name `portal` when `@melodicdev/core` (or `@melodicdev/core/template`) is imported, so `:portal` works in any template with no extra import.

The directive function and its types are exported for typing and for registering it under another name:

```typescript
import { portalDirective } from '@melodicdev/core';
import type { PortalOptions, PortalValue } from '@melodicdev/core';
```

## Usage

### Basic Usage

Teleport an element to `document.body`:

```typescript
import { html, when } from '@melodicdev/core';

html`
  <button @click=${() => this.showModal = true}>Open Modal</button>

  ${when(this.showModal, () => html`
    <div class="modal-overlay" :portal="body">
      <div class="modal">
        <h2>Modal Title</h2>
        <p>Modal content here</p>
        <button @click=${() => this.showModal = false}>Close</button>
      </div>
    </div>
  `)}
`
```

### Teleport to Specific Container

Use a CSS selector to target a specific element:

```typescript
// In your index.html
<div id="modal-root"></div>
<div id="tooltip-root"></div>

// In your component
html`
  <div class="modal" :portal="#modal-root">...</div>
  <div class="tooltip" :portal="#tooltip-root">...</div>
`
```

### Dynamic Target

Use a dynamic value for the target:

```typescript
html`
  <div class="dropdown" :portal=${this.dropdownContainer}>
    <ul>
      <li>Option 1</li>
      <li>Option 2</li>
    </ul>
  </div>
`
```

### Persist After Unmount

By default, portaled content is removed when the source component unmounts. Use `persist: true` to keep it:

```typescript
// Content removed when component unmounts (default)
html`<div class="modal" :portal="body">...</div>`

// Content stays after component unmounts
html`<div class="toast" :portal=${{ target: '#notifications', persist: true }}>
  Notification message
</div>`
```

A persisted element is left in the target exactly as it was. The template that rendered it has been torn down, so its bindings no longer update and its `@event` listeners are removed. Nothing removes the element later; remove it yourself when it is no longer needed.

## API

### Portal Value Types

The `:portal` directive accepts three value types:

```typescript
// 1. String selector
:portal="body"
:portal="#modal-root"
:portal=".tooltip-container"

// 2. Element reference
:portal=${document.body}
:portal=${this.containerRef}

// 3. Options object
:portal=${{ target: 'body', persist: false }}
:portal=${{ target: this.container, persist: true }}
```

These three forms are the exported `PortalValue` type (`string | Element | PortalOptions`).

String targets are resolved with `document.querySelector`, so a selector only finds elements in the document itself, never inside a shadow root. To portal into an element that lives in a shadow root, pass the element.

The directive re-runs when the bound value changes, compared by identity. An options object written inline in the template is a new object on every render, so the portal is cleaned up and re-applied each time: without `persist`, the element is removed from the target and appended again on every render. Keep the options object in a field when the component re-renders while the portal is open:

```typescript
portalTarget: PortalOptions = { target: '#modal-root' };

html`<div class="modal" :portal=${this.portalTarget}>...</div>`
```

### PortalOptions Interface

```typescript
interface PortalOptions {
  /** Target element or CSS selector */
  target: string | Element;

  /** Keep content after source component unmounts (default: false) */
  persist?: boolean;
}
```

## Examples

### Modal

```typescript
import { MelodicComponent, html, when } from '@melodicdev/core';

@MelodicComponent({
  selector: 'app-modal-example',
  template: modalTemplate
})
export class ModalExampleComponent {
  isOpen = false;

  open() {
    this.isOpen = true;
  }

  close() {
    this.isOpen = false;
  }
}

function modalTemplate(component: ModalExampleComponent) {
  return html`
    <button @click=${() => component.open()}>Open Modal</button>

    ${when(component.isOpen, () => html`
      <div class="modal-overlay" :portal="body" @click=${() => component.close()}>
        <div class="modal" @click=${(e: Event) => e.stopPropagation()}>
          <header>
            <h2>Modal Title</h2>
            <button class="close" @click=${() => component.close()}>&times;</button>
          </header>
          <main>
            <p>This modal is rendered at document.body level.</p>
          </main>
          <footer>
            <button @click=${() => component.close()}>Close</button>
          </footer>
        </div>
      </div>
    `)}
  `;
}
```

The overlay is moved to `document.body`, outside the component's shadow root, so the component's own `styles` do not reach it. Its styles go in a global stylesheet (see [CSS Considerations](#css-considerations)):

```css
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 8px;
  padding: 20px;
  min-width: 300px;
  max-width: 500px;
}
```

### Tooltip

```typescript
import { MelodicComponent, html, when } from '@melodicdev/core';

@MelodicComponent({
  selector: 'app-tooltip',
  template: tooltipTemplate
})
export class TooltipComponent {
  showTooltip = false;
  tooltipPosition = { x: 0, y: 0 };

  handleMouseEnter(e: MouseEvent) {
    const rect = (e.target as Element).getBoundingClientRect();
    this.tooltipPosition = {
      x: rect.left + rect.width / 2,
      y: rect.top - 10
    };
    this.showTooltip = true;
  }

  handleMouseLeave() {
    this.showTooltip = false;
  }
}

function tooltipTemplate(component: TooltipComponent) {
  return html`
    <button
      @mouseenter=${(e: MouseEvent) => component.handleMouseEnter(e)}
      @mouseleave=${() => component.handleMouseLeave()}
    >
      Hover me
    </button>

    ${when(component.showTooltip, () => html`
      <div
        class="tooltip"
        :portal="body"
        style="
          position: fixed;
          left: ${component.tooltipPosition.x}px;
          top: ${component.tooltipPosition.y}px;
          transform: translate(-50%, -100%);
        "
      >
        Tooltip content
      </div>
    `)}
  `;
}
```

### Toast Notifications (Persistent)

```typescript
// In index.html
<div id="toast-container"></div>

// A component whose message stays behind after the component unmounts
import { MelodicComponent, html } from '@melodicdev/core';
import type { PortalOptions } from '@melodicdev/core';

@MelodicComponent({
  selector: 'app-save-notice',
  template: saveNoticeTemplate
})
export class SaveNoticeComponent {
  // A field, so the same options object is passed on every render
  toastTarget: PortalOptions = { target: '#toast-container', persist: true };
}

function saveNoticeTemplate(component: SaveNoticeComponent) {
  return html`
    <div class="toast" :portal=${component.toastTarget}>Changes saved</div>
  `;
}
```

`:portal` is a template binding: it only does anything inside an `html` template. Writing it into an `innerHTML` string does not run the directive.

## How It Works

1. When the directive is applied, it:
   - Creates a placeholder comment at the original position
   - Resolves the target element (from selector or reference)
   - Moves the element to the target using `appendChild`

2. When the binding is torn down — the source component unmounts, the `when()` branch or list item containing the element is removed, or the bound value changes:
   - The cleanup function is called
   - If `persist: false` (default), the element is removed from the target
   - The placeholder comment is removed

3. The element maintains its event listeners and bindings because it's the same DOM node, just moved to a different location.

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| Value is empty (`undefined`, `null`, `''`) | Console warning, element stays in place |
| Target not found | Console warning, element stays in place |
| Target selector invalid | `document.querySelector` throws a `SyntaxError`; the directive does not catch it |
| Target is inside a shadow root | A selector does not find it (see [Portal Value Types](#portal-value-types)); pass the element |
| Element already in target | No-op, returns without moving |
| Component unmounts | Content removed (unless `persist: true`) |
| Bound value changes | Cleaned up as on unmount, then portaled to the new target |
| Multiple portals to same target | All append in order |

## Best Practices

1. **Use specific containers** - Create dedicated containers (`#modal-root`, `#tooltip-root`) rather than always using `body`

2. **Clean up with `persist: false`** - Only use `persist: true` when the content should outlive the component

3. **Handle z-index** - Ensure your portal containers have appropriate `z-index` values

4. **Accessibility** - Remember to manage focus when opening/closing portaled content (modals especially)

5. **Event propagation** - Use `stopPropagation()` on inner content if the overlay should close on click

## CSS Considerations

Portaled elements are moved outside the shadow DOM, so:
- They won't inherit shadow DOM styles
- Use global styles or inline styles for portaled content
- Consider using CSS custom properties that can cross shadow boundaries

```css
/* Global styles for portaled modals */
.modal-overlay {
  /* These styles need to be in global CSS or inline */
}
```
