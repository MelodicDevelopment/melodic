# Melodic Portal - POC Documentation

A directive that teleports elements to a different location in the DOM, useful for modals, tooltips, dropdowns, and notifications.

## Why Use Portals?

When rendering modals, tooltips, or dropdowns inside a component, they can be affected by:
- Parent `overflow: hidden` clipping the content
- `z-index` stacking context issues
- CSS transforms creating new stacking contexts

Portals solve this by rendering the content at a different location (typically `document.body`), escaping these constraints.

## Installation

Import from the portal module to register the directive:

```typescript
import './_poc/portal';

// Or import specific exports
import { portalDirective } from './_poc/portal';
import type { PortalOptions } from './_poc/portal';
```

## Usage

### Basic Usage

Teleport an element to `document.body`:

```typescript
import { html } from 'melodic';
import './_poc/portal';

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
import { MelodicComponent, html, css } from 'melodic';
import './_poc/portal';

@MelodicComponent({
  selector: 'app-modal-example',
  template: modalTemplate,
  styles: modalStyles
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

function modalStyles() {
  return css`
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
  `;
}
```

### Tooltip

```typescript
import { MelodicComponent, html } from 'melodic';
import './_poc/portal';

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

// Toast service
class ToastService {
  show(message: string) {
    // Toast stays even after calling component unmounts
    const toast = document.createElement('div');
    toast.innerHTML = `
      <app-toast
        message="${message}"
        :portal=${{ target: '#toast-container', persist: true }}
      ></app-toast>
    `;
  }
}
```

## How It Works

1. When the directive is applied, it:
   - Creates a placeholder comment at the original position
   - Resolves the target element (from selector or reference)
   - Moves the element to the target using `appendChild`

2. When the source component unmounts:
   - The cleanup function is called
   - If `persist: false` (default), the element is removed from the target
   - The placeholder comment is removed

3. The element maintains its event listeners and bindings because it's the same DOM node, just moved to a different location.

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| Target not found | Console warning, element stays in place |
| Target selector invalid | Console warning, element stays in place |
| Element already in target | No-op, returns without moving |
| Component unmounts | Content removed (unless `persist: true`) |
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
