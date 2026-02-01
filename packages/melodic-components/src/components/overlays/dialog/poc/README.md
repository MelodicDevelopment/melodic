# Dialog POC

This is a proof-of-concept implementation following the Angular dialog pattern from LanguageBird's `melodic-ui` library.

## Key Differences from Current Modal Implementation

| Current (`modal.service.ts`) | POC (`dialog.service.ts`) |
|------------------------------|---------------------------|
| `MlModal` + `MlModalHost` components | Single `MlDialog` wrapper component |
| Content mounts inside host's shadow DOM | Content wraps itself with `<ml-dialog>` |
| Title/description passed as config | Header/footer via slots in template |
| `ModalContent` interface | `dialogRef` property set on component |

## Pattern Overview

### 1. Dialog Service
Opens dialogs by creating an overlay and mounting the content component.

```typescript
import { dialogService } from './poc';

const ref = dialogService.open(MyDialog, {
  size: 'md',
  inputs: { userId: 123 }
});

const result = await ref.afterClosed();
```

### 2. Dialog Content Component
Content components use `<ml-dialog>` as a wrapper with slots for header/footer.

```typescript
@MelodicComponent({
  selector: 'my-dialog',
  template: (c: MyDialog) => html`
    <ml-dialog>
      <div slot="header">
        <ml-icon icon="settings"></ml-icon>
        <span>Dialog Title</span>
      </div>

      <p>Body content here</p>

      <div slot="footer">
        <ml-button @click=${() => c.dialogRef?.close()}>Cancel</ml-button>
        <ml-button variant="primary" @click=${() => c.save()}>Save</ml-button>
      </div>
    </ml-dialog>
  `
})
class MyDialog {
  dialogRef?: DialogRef<boolean>;  // Set by DialogService

  save() {
    this.dialogRef?.close(true);
  }
}
```

### 3. MlDialog Component
The `<ml-dialog>` wrapper provides:
- Consistent header with close button
- Scrollable body area
- Footer section
- Size variants via attribute
- Keyboard handling (Escape to close)

### 4. DialogRef
Reference for controlling the dialog from inside:

```typescript
// Close with result
this.dialogRef?.close(result);

// Wait for open
await this.dialogRef?.afterOpened();

// Wait for close
const result = await ref.afterClosed();
```

## Files

| File | Description |
|------|-------------|
| `dialog.component.ts` | `<ml-dialog>` wrapper component |
| `dialog.service.ts` | Service to open dialogs programmatically |
| `dialog-ref.ts` | Reference class for controlling dialogs |
| `overlay.component.ts` | Backdrop/overlay component |
| `example-dialog.component.ts` | Simple confirm dialog example |
| `advanced-example-dialog.component.ts` | Complex example with edit/delete/loading |

## Component Registration

To use, register the components:

```typescript
import { MlDialog, MlDialogOverlay, ExampleDialog } from './poc';

// These will auto-register via @MelodicComponent
// Just import them to ensure registration
```

## Comparison with Angular Pattern

### Angular (LanguageBird)
```html
<md-dialog>
  <div md-dialog-header>
    <md-icon>settings</md-icon>
    <span>Title</span>
  </div>

  Content

  <div md-dialog-footer>
    <button md-button (click)="close()">Cancel</button>
  </div>
</md-dialog>
```

### Melodic POC
```html
<ml-dialog>
  <div slot="header">
    <ml-icon icon="settings"></ml-icon>
    <span>Title</span>
  </div>

  Content

  <div slot="footer">
    <ml-button @click=${() => c.close()}>Cancel</ml-button>
  </div>
</ml-dialog>
```

Key differences:
- Angular uses directives (`md-dialog-header`) vs Web Component slots (`slot="header"`)
- Angular has separate header/footer components, POC uses slots
- Both use a service to open dialogs programmatically
- Both inject a reference for closing

## Next Steps

If this pattern is approved:
1. Replace current `modal.service.ts` with this pattern
2. Update existing modal usage
3. Consider adding:
   - Backdrop click to close (currently close button only)
   - Stacking support for multiple dialogs
   - Animation customization
   - Focus trap improvements
