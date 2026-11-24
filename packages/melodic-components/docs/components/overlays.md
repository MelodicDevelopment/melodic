# Overlay Components

- [ml-dialog (DialogService)](#ml-dialog--dialogservice)
- [ml-drawer](#ml-drawer)
- [ml-popover](#ml-popover)
- [ml-dropdown](#ml-dropdown)
- [ml-tooltip](#ml-tooltip)

`ml-dialog` and `ml-drawer` use the native `<dialog>` element; `ml-popover` and `ml-dropdown` use the [Popover API](https://developer.mozilla.org/en-US/docs/Web/API/Popover_API). `ml-tooltip` uses neither: its popup is a fixed-position element stacked with `--ml-tooltip-z-index`. Popover, dropdown and tooltip all use `autoUpdate` positioning for robust scroll/resize handling.

---

## ml-dialog / DialogService

Uses the native `<dialog>` element.

**Accessible name:** the dialog is named by whatever is slotted into `dialog-header`. To name it differently — or when there is no header — set `label`:

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `label` | `string` | `''` | Accessible name (`aria-label`) for the dialog. Overrides the header |

```html
<ml-dialog id="confirm" label="Confirm deletion">…</ml-dialog>
```

```ts
import '@melodicdev/components/dialog';
import { DialogService } from '@melodicdev/components';
```

### Declarative usage

Name the dialog with a `#`-prefixed attribute and open/close it through `DialogService`
using that name **without** the `#`. (A dialog with no `#name` gets a generated id.)

```html
<ml-button @ml:click=${() => this.openDialog('confirm')}>Delete</ml-button>

<ml-dialog #confirm>
  <div slot="dialog-header">Confirm deletion</div>
  <p>Are you sure? This action cannot be undone.</p>
  <div slot="dialog-footer">
    <ml-button variant="outline" @ml:click=${() => this.closeDialog('confirm')}>Cancel</ml-button>
    <ml-button variant="danger"  @ml:click=${() => this.confirmDelete()}>Delete</ml-button>
  </div>
</ml-dialog>
```

```ts
import { DialogService } from '@melodicdev/components/dialog';

@Service(DialogService)
private readonly _dialog!: DialogService;

// The id is the name of the `#`-prefixed attribute on <ml-dialog>, without the `#`.
openDialog(id: string): void {
  this._dialog.open(id);
}

closeDialog(id: string, result?: unknown): void {
  this._dialog.close(id, result);
}
```

The id is a plain string: `<ml-dialog #confirm>` opens with `open('confirm')` and closes with
`close('confirm', result?)`.

`open()` and `close(result?)` also exist on the component instance, not on the element:
`dialogEl.component.open()`. Methods declared on a component's class are not mirrored onto
its host element — only its fields are — so `dialogEl.open()` is not a function.

### Dynamic component usage (DialogService)

Open a component class dynamically. The dialog is auto-mounted to `document.body` and cleaned up on close.

```ts
@Service(DialogService)
private readonly _dialog!: DialogService;

openConfirmation(): void {
  const ref = this._dialog.open(ConfirmationDialog, {
    data: { message: 'Are you sure?' },
    size: 'sm',
  });

  ref.afterClosed((result) => {
    if (result === true) this.deleteItem();
  });
}
```

Inside `ConfirmationDialog`, implement `onDialogRefSet` to receive the ref, and close
through it:

```ts
import type { DialogRef, IDialogRef } from '@melodicdev/components/dialog';

export class ConfirmationDialog implements IDialogRef {
  private _dialogRef!: DialogRef;

  onDialogRefSet(dialogRef: DialogRef): void {
    this._dialogRef = dialogRef;   // dialogRef.data is the config's `data`
  }

  confirm(): void {
    this._dialogRef.close(true);
  }
}
```

**DialogService methods:**

| Method | Description |
|--------|-------------|
| `open(idOrComponent, config?)` | Open by id (a plain string) or component class |
| `close(id, result?)` | Close by ID; result is passed to `afterClosed` callbacks |

**IDialogConfig:**

```ts
interface IDialogConfig<T = unknown> {
  data?: T;                // passed to the dynamic component
  disableClose?: boolean;  // prevent Escape and backdrop-click close
  panelClass?: string | string[];
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full' | 'auto' | 'custom';
  width?: string;          // sets max-width on the dialog, whatever the size
}
```

**DialogRef methods:**

| Method | Description |
|--------|-------------|
| `open()` | Open the dialog |
| `close(result?)` | Close with an optional result |
| `afterOpened(fn)` | Callback fired after **every** open. Returns an unsubscribe function |
| `afterClosed(fn)` | Callback fired with the result after **every** close, including Escape and backdrop dismissal. Returns an unsubscribe function |

A `DialogRef` also exposes the read-only properties `dialogID`, `data` (the config's `data`) and `disableClose`.

**Slots:** `dialog-header`, `default` (body), `dialog-footer`

**Events:** `ml:open`, `ml:close` `{ result? }`

### Dialog callbacks and inline dialogs

`afterOpened` and `afterClosed` are persistent: one registration fires on every open/close
cycle. A dialog opened through `DialogService` gets a fresh `DialogRef` each time, so there
is nothing to clean up.

An inline `<ml-dialog>` is different — it keeps **one** `DialogRef` for its lifetime. If you
register a callback each time you open it, every previous registration is still attached and
they all run:

```typescript
// Leaks: a new closure is attached on every open, and none are ever released.
open(): void {
	this.ref.afterClosed((result) => this.save(result));
	this.ref.open();
}
```

Either register once, outside the open path, or release the previous registration with the
unsubscribe function:

```typescript
open(): void {
	this._stop?.();
	this._stop = this.ref.afterClosed((result) => this.save(result));
	this.ref.open();
}
```

Dev mode warns once a single dialog accumulates 20 callbacks.

---

## ml-drawer

Side panel drawer using native `<dialog>`. Slides in from the left or right.

```ts
import '@melodicdev/components/drawer';
```

```html
<ml-button @ml:click=${() => this.openDrawer()}>Open Settings</ml-button>

<ml-drawer id="settingsDrawer" side="right" size="md">
  <span slot="drawer-header">Settings</span>
  <div>
    <p>Drawer content goes here.</p>
  </div>
  <div slot="drawer-footer">
    <ml-button variant="outline" @ml:click=${() => this.drawer()?.component.close()}>Cancel</ml-button>
    <ml-button @ml:click=${() => this.save()}>Save</ml-button>
  </div>
</ml-drawer>
```

`open()` and `close()` are on the drawer's component instance, reached through the
element's `component` property (`close()` can also be called on the element itself). The
drawer lives in your component's shadow root:

```ts
import type { DrawerComponent } from '@melodicdev/components/drawer';

private drawer(): (HTMLElement & { component: DrawerComponent }) | null {
  return this.elementRef.shadowRoot?.querySelector('#settingsDrawer') ?? null;
}

openDrawer(): void {
  this.drawer()?.component.open();
}
```

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `side` | `'left'` \| `'right'` | `'right'` | Slide-in direction |
| `size` | `'sm'` \| `'md'` \| `'lg'` \| `'xl'` | `'md'` | Panel width preset |
| `showClose` | `boolean` | `true` | Show the built-in × close button. Attribute: `show-close` (`show-close="false"` hides it) |
| `label` | `string` | `''` | Accessible name (`aria-label`) for the drawer. Defaults to the content of the `drawer-header` slot |

**Size presets:** sm = 320px, md = 480px, lg = 640px, xl = 800px

**Slots:** `drawer-header`, `default` (body), `drawer-footer`

**Events:** `ml:open` (opening starts), `ml:opened` (slide-in animation finished), `ml:close` (closing starts), `ml:closed` (slide-out animation finished and the drawer is closed)

**Methods:** `open()` — reachable only through the component instance (`drawerEl.component.open()`); `close()` — works through `.component` and on the element itself (`drawerEl.close()`)

Closes on backdrop click and on Escape. Calling `open()` while the drawer is still sliding closed reopens it. The slide is skipped when the user has asked for reduced motion.

---

## ml-popover

Arbitrary positioned popup using the Popover API with floating UI positioning.

```ts
import '@melodicdev/components/popover';
```

```html
<ml-popover placement="bottom" offset="8" arrow>
  <ml-button slot="trigger">More info</ml-button>
  <div style="padding: 1rem; max-width: 240px">
    <h3>Popover Title</h3>
    <p>Rich content with interactive elements.</p>
    <ml-button size="sm">Take action</ml-button>
  </div>
</ml-popover>

<!-- Manual control (no auto-dismiss on click-outside) -->
<ml-popover placement="right" manual>
  <ml-icon slot="trigger" icon="info"></ml-icon>
  <p>This stays open on outside clicks. Escape or close() closes it.</p>
</ml-popover>
```

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `placement` | `Placement` | `'bottom'` | Preferred position relative to the trigger |
| `offset` | `number` | `8` | Gap in pixels between trigger and popover |
| `manual` | `boolean` | `false` | Disable light-dismiss (click-outside). Escape still closes the popover |
| `arrow` | `boolean` | `false` | Show an arrow pointing at the trigger |
| `label` | `string` | `''` | Accessible name (`aria-label`) for the popover panel |

**Accessibility:** the panel is a `role="dialog"` that traps focus while open — give it a `label`. The slotted trigger gets `aria-haspopup="dialog"` (unless you set your own `aria-haspopup`) and `aria-expanded`, placed on the element that takes focus (for an `<ml-button>` trigger, its inner button). Focus is trapped across everything in the panel, including controls inside nested components such as `<ml-input>`.

**Placement values:** `'top'` \| `'top-start'` \| `'top-end'` \| `'bottom'` \| `'bottom-start'` \| `'bottom-end'` \| `'left'` \| `'left-start'` \| `'left-end'` \| `'right'` \| `'right-start'` \| `'right-end'`

**Slots:** `trigger` (the element that toggles the popover), `default` (popover content)

**State:** `isOpen` (`boolean`) — whether the popover is open. Read it; change it through the methods

**Events:** `ml:open`, `ml:close`

**Methods:** `open()`, `close()` — reachable only through the component instance (`popoverEl.component.open()`); `toggle()` — also callable on the element itself

Uses `autoUpdate` to reposition on scroll and resize.

**Key CSS Custom Properties:**

| Property | Default | Description |
|----------|---------|-------------|
| `--ml-popover-bg` | `var(--ml-color-surface)` | Panel background |
| `--ml-popover-color` | `var(--ml-color-text)` | Panel text color |
| `--ml-popover-border-color` | `var(--ml-color-border)` | Panel border color |
| `--ml-popover-radius` | `var(--ml-radius-lg)` | Panel border radius |
| `--ml-popover-shadow` | `var(--ml-shadow-lg)` | Panel box shadow |
| `--ml-popover-content-overflow` | `visible` | Content overflow (set to `auto` for scroll) |

---

## ml-dropdown

Action menu with grouped items, icons, keyboard shortcuts, and destructive items.

```ts
import '@melodicdev/components/dropdown';
```

```html
<ml-dropdown placement="bottom-start" @ml:select=${e => this.handleAction(e.detail.value)}>
  <ml-button slot="trigger">
    Actions <ml-icon icon="caret-down"></ml-icon>
  </ml-button>

  <ml-dropdown-item value="edit"      icon="pencil-simple">Edit</ml-dropdown-item>
  <ml-dropdown-item value="duplicate" icon="copy">Duplicate</ml-dropdown-item>

  <ml-dropdown-separator></ml-dropdown-separator>

  <ml-dropdown-item value="delete" icon="trash" destructive>Delete</ml-dropdown-item>
</ml-dropdown>
```

**With groups and keyboard shortcuts:**

```html
<ml-dropdown>
  <ml-button slot="trigger">Edit</ml-button>

  <ml-dropdown-group label="Clipboard">
    <ml-dropdown-item value="cut"   icon="scissors" addon="⌘X">Cut</ml-dropdown-item>
    <ml-dropdown-item value="copy"  icon="copy"     addon="⌘C">Copy</ml-dropdown-item>
    <ml-dropdown-item value="paste" icon="clipboard" addon="⌘V" disabled>Paste</ml-dropdown-item>
  </ml-dropdown-group>

  <ml-dropdown-separator></ml-dropdown-separator>

  <ml-dropdown-group label="Account">
    <ml-dropdown-item value="settings" icon="gear">Settings</ml-dropdown-item>
    <ml-dropdown-item value="signout"  icon="sign-out" destructive>Sign Out</ml-dropdown-item>
  </ml-dropdown-group>
</ml-dropdown>
```

**ml-dropdown:**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `placement` | `Placement` | `'bottom-start'` | Menu position |
| `offset` | `number` | `4` | Gap in pixels |
| `arrow` | `boolean` | `false` | Show positioning arrow |

**State:** `isOpen` (`boolean`) — whether the menu is open. Read it; change it through the methods

**Events:** `ml:select` `{ value }`, `ml:open`, `ml:close`

**Methods:** `open()`, `close()` — reachable only through the component instance (`dropdownEl.component.close()`); `toggle()` — also callable on the element itself

**ml-dropdown-item:**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `value` | `string` | `''` | Selection value emitted in `ml:select` |
| `icon` | `string` | `''` | Left Phosphor icon |
| `addon` | `string` | `''` | Right text (keyboard shortcut hint, etc.) |
| `disabled` | `boolean` | `false` | Non-interactive (still visible) |
| `destructive` | `boolean` | `false` | Red danger styling |

**ml-dropdown-group:**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `label` | `string` | `''` | Uppercase section header |

**ml-dropdown-separator:** No properties. Renders a horizontal divider line.

Keyboard: ArrowDown, Enter or Space on the trigger opens the menu. ArrowDown/ArrowUp, Home, End move focus. Enter/Space selects. Escape and Tab close.

---

## ml-tooltip

Accessible tooltip that appears on hover and keyboard focus.

```ts
import '@melodicdev/components/tooltip';
```

```html
<!-- Wrapping usage -->
<ml-tooltip content="Save your changes" placement="top">
  <ml-button>Save</ml-button>
</ml-tooltip>

<!-- Directive usage (no wrapper element needed) -->
<ml-button :tooltip="Save your changes">Save</ml-button>
```

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `content` | `string` | `''` | Tooltip text |
| `placement` | `Placement` | `'top'` | Preferred position |
| `delay` | `number` | `200` | Show delay in milliseconds |

**Slots:** `default` (the element that triggers the tooltip)

**Methods:** `show()` (shows after `delay`), `hide()` — callable on the element or through `.component`

Pressing Escape dismisses the tooltip while it is visible.

Uses `computePosition` with `flip`, `shift`, and `offset` middleware to stay in view.

**Accessibility:** the tooltip text is exposed as the trigger's description (`aria-description`) and follows `content` when it changes. A trigger that already has its own `aria-describedby` is left alone.

### `:tooltip` directive

For inline usage without a wrapper element, import the directives entry point. It registers
the `:tooltip` attribute directive:

```ts
import '@melodicdev/components/directives';
```

```html
<ml-button :tooltip="Save your changes">Save</ml-button>
<ml-icon icon="question" :tooltip=${{ content: 'Learn more', placement: 'right' }}></ml-icon>
```

The value is a string or `{ content, placement? }`; `placement` defaults to `'top'`.
