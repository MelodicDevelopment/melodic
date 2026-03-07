# Scoped / Hierarchical Injection for Melodic DI

## Problem

The current `InjectionEngine` is a single global container. All components resolve dependencies from this one instance via `@Service(TOKEN)` and `@Inject(TOKEN)`. There is no concept of child injectors or scoped containers.

This becomes a limitation when a subsystem needs to provide instance-specific data through DI. The concrete use case driving this: the `DialogService` opens component-based dialogs and passes `data` via `IDialogConfig`, but the dialog component has no way to inject that data — it must implement `IDialogRef.onDialogRefSet()` and manually map `dialogRef.data` onto its own properties. In Angular, `MatDialog` solves this by creating a child injector per dialog and binding `MAT_DIALOG_DATA` in that scope.

## What Needs to Change

### 1. InjectionEngine — Add Child Injector Support

- Add an optional `parent` parameter to `InjectionEngine` (or a `createChild()` method)
- Child `get<T>(token)` checks its own bindings first, then delegates to `parent.get<T>(token)` if not found locally
- Child injectors are independent containers — `bindValue`, `bind`, `bindFactory` only affect the child scope
- `has<T>(token)` should check both child and parent chain

### 2. @Service Decorator — Support Scoped Resolution

Currently hardcoded to `Injector.get<T>(token)`. Needs to resolve from a **contextual injector** when one exists, falling back to the global `Injector`.

Options to explore:
- **Component-associated injector**: Store a scoped injector reference on the component instance (e.g., `this.__injector`), and have `@Service` check for it before the global
- **Context-based lookup**: Use a WeakMap or similar to associate DOM elements with injector scopes, walking up the tree to find the nearest scoped injector

### 3. DialogService — Create Scoped Injector Per Dialog

When `DialogService.open()` mounts a component-based dialog:
1. Create a child injector from the global `Injector`
2. Bind `DIALOG_DATA` token with the config's `data` value in the child scope
3. Bind `DIALOG_REF` token with the `DialogRef` instance in the child scope
4. Associate the child injector with the dialog component before it resolves dependencies
5. Clean up (dispose child injector) when the dialog closes

### 4. Dialog Components — Clean Injection

With scoped injection, a dialog component would look like:

```typescript
export class ConfirmDialog {
    @Service(DIALOG_DATA) private data!: ConfirmDialogData;
    @Service(DIALOG_REF) private dialogRef!: DialogRef<boolean>;
}
```

No `IDialogRef` interface, no `onDialogRefSet` callback, no manual property mapping.

## Current Files Involved

- `packages/melodic-core/src/injection/injection-engine.class.ts` — the DI container
- `packages/melodic-core/src/injection/decorators/service.decorator.ts` — property injection (uses global `Injector`)
- `packages/melodic-core/src/injection/decorators/inject.decorator.ts` — constructor injection
- `packages/melodic-core/src/components/melodic-component.decorator.ts` — component creation, resolves DI at `createElement` time
- `packages/melodic-components/src/components/overlays/dialog/dialog.service.ts` — mounts dialog components, calls `onDialogRefSet`
- `packages/melodic-components/src/components/overlays/dialog/dialog-config.interface.ts` — `IDialogConfig` with `data` property

## Broader Value

Scoped injection isn't just for dialogs. It enables:
- **Lazy-loaded feature modules** with isolated services
- **Repeated widget instances** that each need their own service scope (e.g., multiple form builders on one page)
- **Testing** — swap bindings per test without polluting the global container
