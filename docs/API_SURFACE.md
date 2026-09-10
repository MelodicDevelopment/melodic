# API surface

Everything `@melodicdev/core` exports, grouped by who it is for. The guides in this folder
cover the day-to-day API in depth; this page exists so that no export is a mystery — a name
you can import but cannot find documented anywhere is worse than no name at all.

Three tiers:

- **Application API** — what you use to build an app. Covered by the guides.
- **Extension API** — for building framework-level tooling: custom directives, adapters,
  test utilities, DevTools. Stable, but you will not need it in application code.
- **Internal** — exported because the framework's own modules need it across entry points.
  Not covered by semver guarantees for behaviour; treat it as private.

---

## Application API

| Area | Exports | Guide |
|---|---|---|
| Components | `MelodicComponent`, `ComponentBase`, `emit` | [COMPONENT_SYSTEM.md](./COMPONENT_SYSTEM.md) |
| Templates | `html`, `css`, `render`, `repeat`, `repeatRaw`, `when`, `classMap`, `styleMap`, `unsafeHTML`, `live`, `portalDirective` | [TEMPLATE_SYSTEM.md](./TEMPLATE_SYSTEM.md), [PORTAL.md](./PORTAL.md) |
| Signals | `signal`, `computed`, `effect`, `untracked`, `batch`, `isSignal` | [SIGNALS.md](./SIGNALS.md) |
| Routing | `provideRouter`, `RouterService`, `RouterOutletComponent`, `RouterLinkComponent`, `routerLinkDirective`, `createGuard`, `createDeactivateGuard`, `createResolver`, `findRouteByName`, `buildPathFromRoute` | [ROUTING.md](./ROUTING.md) |
| Forms | `createFormControl`, `createFormGroup`, `createFormArray`, `Validators`, `createValidator`, `createAsyncValidator`, `registerDefaultMessages`, `registerAdapter`, `formControlDirective`, `modelDirective` | [FORMS.md](./FORMS.md) |
| HTTP | `provideHttp`, `HttpClient`, `HttpError`, `NetworkError`, `AbortError` | [HTTP.md](./HTTP.md) |
| Injection | `Injectable`, `Inject`, `Service`, `inject`, `injectOptional`, `createToken`, `Injector` | [INJECTION.md](./INJECTION.md) |
| State | `provideRX`, `SignalStoreService`, `createAction`, `createReducer`, `createState`, `onAction`, `EffectsBase`, `ComponentStateBaseService` | [STATE.md](./STATE.md) |
| Config | `defineConfig`, `provideConfig`, `APP_CONFIG`, `environment`, `getEnvironment` | [CONFIG.md](./CONFIG.md) |
| Bootstrap | `bootstrap` | [BOOTSTRAP.md](./BOOTSTRAP.md) |
| Testing | `mount`, `flush`, `query`, `queryAll`, `text`, `captureEvents`, `unmountAll` (from `@melodicdev/core/testing`) | [TESTING.md](./TESTING.md) |

### Error classes

`HttpError` carries the response (`error.response.status`, `.data`). `NetworkError` means
the request never produced a response — DNS, offline, CORS. `AbortError` means it was
cancelled, by an `AbortSignal` or a timeout. Catch the specific class rather than checking
messages.

---

## Extension API

For tooling and library authors.

| Export | What it is for |
|---|---|
| `directive(renderFn, type?)` | Build a value directive (the `when`/`repeat` shape) |
| `registerAttributeDirective`, `getAttributeDirective`, `hasAttributeDirective`, `unregisterAttributeDirective`, `getRegisteredDirectives` | The `:name=${value}` directive registry — see [ATTRIBUTE_DIRECTIVES.md](./ATTRIBUTE_DIRECTIVES.md) |
| `Directive` | Class-based directive base |
| `isDirective` | Identify a directive result |
| `registerAdapter`, `getAdapter` | Teach the forms system (and `:model`) how to read/write a control |
| `SignalEffect` | The primitive `effect()` and the render tracker are built on |
| `getActiveComponent`, `setActiveComponent` | The ownership scope resources register with. Read it to own a resource; set it only when you construct components yourself |
| `getActiveEffect`, `setActiveEffect` | The tracking scope signal reads register with. `untracked()` is the supported way to clear it |
| `RouteMatcher` | Path-pattern matching (`parse`, `parsePrefix`, `stringify`) outside the router |
| `RouterLinkCore` | The shared implementation behind `<router-link>` and `:routerLink`; use it to build another link element |
| `installHistoryEvents` | Idempotently patches `pushState`/`replaceState` to emit a window `NavigationEvent`. `provideRouter()` and `RouterService` both call it; call it directly only when driving history without either |
| `matchRouteTree` | Match a URL against a route tree without navigating |
| `parseUrlParts`, `appendQueryParams` | URL splitting and query merging that puts params before the fragment |
| `isSafeUrl` | The scheme allow-list router links use |
| `getComponentDefinitions`, `getComponentDefinition` | Every registered component, for tooling |
| `attributeNames`, `attributeTypes` | Normalize either `attributes` form |
| `applyGlobalStyles`, `refreshGlobalStyles` | Adopt `melodic-styles` sheets into a shadow root |
| `disposePart`, `disposeParts`, `disposeContainerParts`, `disposeDirectiveState` | Dispose a rendered part tree. Needed when you render into a container you own and must tear down yourself |
| `renderDetached` | Render into a detached container that keeps its part tree |
| DevTools (`@melodicdev/core/devtools`): `isDevMode`, `setDevMode`, `devWarn`, `resetDevWarnings`, `getHook`, `emitDevtools`, `devtoolsListening`, `installConsoleApi`, `createConsoleApi` | The dev-mode switch and the in-page hook — see [BOOTSTRAP.md](./BOOTSTRAP.md#the-melodic-console-api) |

---

## Internal

Exported for cross-entry use inside the framework. No guide covers them, and their
behaviour may change in a minor release:

`SIGNAL_MARKER`, `TemplateResult`, `RouteContextService`, `RouteContextEvent`,
`ROUTE_CONTEXT_EVENT`, `InjectionEngine`, `Binding`, `getTokenKey`, `describeToken`,
`RX_INIT_STATE`, `RX_ACTION_PROVIDERS`, `RX_EFFECTS_PROVIDERS`, `RX_STATE_DEBUG`,
`setCurrentMatches`, and the `ITemplatePart` family of types (exported for typing only).

If you find yourself needing one of these in application code, that is usually a gap in the
application API — please open an issue rather than building on it.
