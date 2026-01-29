// Dialog component (wrapper for content)
export { MlDialog } from './dialog.component';

// Dialog service (for opening dialogs)
export { dialogService } from './dialog.service';
export type { DialogConfig, DialogComponentConstructor } from './dialog.service';

// Dialog reference (for controlling dialogs)
export { DialogRef, ML_DIALOG_REF } from './dialog-ref';

// Overlay component (internal, but exported for registration)
export { MlDialogOverlay } from './overlay.component';

// Example components (for reference/testing)
export { ExampleDialog } from './example-dialog.component';
export { AdvancedExampleDialog } from './advanced-example-dialog.component';
export type { UserData } from './advanced-example-dialog.component';
