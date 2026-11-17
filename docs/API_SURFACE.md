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

## Entry points

`@melodicdev/core` re-exports every module below in full, with two exceptions: nothing from
`testing`, and only five of the ten `devtools` functions (noted in the Extension table).
Each module is also its own entry point:

| Import path | Module |
|---|---|
| `@melodicdev/core` | Everything, with the two exceptions above |
| `@melodicdev/core/bootstrap` | Bootstrap |
| `@melodicdev/core/components` | Components |
| `@melodicdev/core/config` | Config |
| `@melodicdev/core/devtools` | DevTools — the full set |
| `@melodicdev/core/forms` | Forms |
| `@melodicdev/core/http` | HTTP |
| `@melodicdev/core/injection` | Injection |
| `@melodicdev/core/interfaces` | The shared `INewable` type |
| `@melodicdev/core/routing` | Routing |
| `@melodicdev/core/signals` | Signals |
| `@melodicdev/core/state` | State |
| `@melodicdev/core/template` | Templates |
| `@melodicdev/core/testing` | Testing — only available from this path |
| `@melodicdev/core/package.json` | The package manifest, for tooling that reads the version |

The attribute directives register themselves when their module is imported: `:portal` with
`template`, `:routerLink` with `routing`, `:formControl` and `:model` with `forms`. Importing
`@melodicdev/core` registers all four.

---

## Application API

| Area | Exports | Guide |
|---|---|---|
| Components | `MelodicComponent`, `ComponentBase`, `emit` | [COMPONENT_SYSTEM.md](./COMPONENT_SYSTEM.md) |
| Templates | `html`, `css`, `render`, `repeat`, `repeatRaw` (deprecated; prefer `repeat`), `when`, `classMap`, `styleMap`, `unsafeHTML`, `live`, `portalDirective` | [TEMPLATE_SYSTEM.md](./TEMPLATE_SYSTEM.md), [PORTAL.md](./PORTAL.md) |
| Signals | `signal`, `computed`, `effect`, `untracked`, `batch`, `isSignal` | [SIGNALS.md](./SIGNALS.md) |
| Routing | `provideRouter`, `RouterService`, `RouterOutletComponent`, `RouterLinkComponent`, `routerLinkDirective`, `createGuard`, `createDeactivateGuard`, `createResolver`, `findRouteByName`, `buildPathFromRoute` | [ROUTING.md](./ROUTING.md) |
| Forms | `createFormControl`, `createFormGroup`, `createFormArray`, `AbstractControl`, `FormControl`, `FormGroup`, `FormArray`, `Validators`, `createValidator`, `createAsyncValidator`, `registerDefaultMessages`, `setDefaultMessage`, `registerAdapter`, `formControlDirective`, `modelDirective` | [FORMS.md](./FORMS.md) |
| HTTP | `provideHttp`, `HttpClient`, `HttpBaseError`, `HttpError`, `NetworkError`, `AbortError` | [HTTP.md](./HTTP.md) |
| Injection | `Injectable`, `Inject`, `Service`, `inject`, `injectOptional`, `createToken`, `Injector` | [INJECTION.md](./INJECTION.md) |
| State | `provideRX`, `SignalStoreService`, `createAction`, `props`, `createReducer`, `createState`, `onAction`, `EffectsBase`, `ComponentStateBaseService` | [STATE.md](./STATE.md) |
| Config | `defineConfig`, `provideConfig`, `APP_CONFIG`, `environment`, `getEnvironment` | [CONFIG.md](./CONFIG.md) |
| Bootstrap | `bootstrap` | [BOOTSTRAP.md](./BOOTSTRAP.md) |
| Testing | `mount`, `flush`, `query`, `queryAll`, `text`, `captureEvents`, `unmountAll`, `base` (from `@melodicdev/core/testing`) | [TESTING.md](./TESTING.md) |

### Error classes

`HttpError` carries the response (`error.response.status`, `.data`). `NetworkError` means
the request never produced a response — DNS, offline, CORS. `AbortError` means it was
cancelled, by an `AbortSignal` or a timeout. Catch the specific class rather than checking
messages. All three extend the abstract `HttpBaseError`, which carries the request `config`
and a `code` (`HTTP_<status>`, `NETWORK_ERROR`, `ABORTED`); catch it to handle any of them.

### Types

Exported for typing only (`import type`).

| Area | Types |
|---|---|
| Components | `Component`, `ComponentMeta`, `TypedComponentMeta`, `ComponentAttributes`, `AttributeType`, `IElementRef`, `ILifeCycleHooks`, `OnInit`, `OnCreate`, `OnConnect`, `OnDisconnect`, `OnRender`, `OnDestroy`, `OnAttributeChange`, `OnPropertyChange`, `IEmitOptions` |
| Templates | `PortalOptions`, `PortalValue` |
| Signals | `Signal`, `ReadonlySignal`, `ISignalOptions`, `IComputedOptions`, `IEffectOptions`, `IEffectRef`, `EffectCleanup`, `Subscriber`, `Unsubscriber` |
| Routing | `IRoute`, `RouteParams`, `IRouterOptions`, `INavigationOptions`, `INavigationResult`, `INavigationEvent`, `NavigationEventType`, `IRouteChange`, `IRouteChangeAware`, `GuardFunction`, `GuardResult`, `AsyncGuardResult`, `IGuardContext`, `IRouteGuard`, `ResolverFunction`, `ResolverResult`, `IResolverContext`, `IRouteResolver`, `IRouterLinkOptions`, `IRouteMatch`, `IRouteMatchResult` |
| Forms | `ControlOptions`, `ControlState`, `SetValueOptions`, `UpdateOn`, `ValidatorFn`, `AsyncValidatorFn`, `ValidationError`, `ValidationErrors`, `MessageMap`, `MessageValue`, `MessageResolver`, `FormGroupControls`, `FormGroupValue`, `ICreateValidatorOptions` |
| HTTP | `IHttpClientConfig`, `IRequestConfig`, `IHttpResponse`, `IHttpRequestInterceptor`, `IHttpResponseInterceptor`, `IHttpResponseErrorContext`, `IInterceptorApi`, `IProgressEvent`, `IRequestCancellation`, `HttpMethod`, `HttpRequestBody`, `HttpResponseType` |
| Injection | `Token`, `IInjectionToken`, `IClassBindingOptions`, `IFactoryBindingOptions` |
| State | `State`, `Action`, `TypedAction`, `ActionRef`, `TypedActionRef`, `ActionPayload`, `ActionIdentifier`, `Reducer`, `ActionReducer`, `ReducerConfig`, `ActionReducerMap`, `Effect`, `ActionEffect`, `ActionEffects`, `ActionEffectsMap` |
| Config | `Environment`, `ConfigDefinition` |
| Bootstrap | `IAppConfig`, `IMelodicApp`, `Provider` |
| Testing | `IMountedComponent`, `IMountOptions` (from `@melodicdev/core/testing`) |
| Shared | `INewable` |

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
| `textAdapter`, `checkboxAdapter`, `radioAdapter` | The adapters registered for native `input`/`textarea`/`select`, checkboxes and radios; reuse one when registering a custom element that behaves the same way |
| `getGlobalMessage`, `resolveMessage` | Read a message from the global validation-message registry, and turn a message (string or function of the error params) into text |
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
| `resolveEnvironment` | The precedence rules behind `getEnvironment()`, as a pure function of an env object so they can be tested |
| DevTools (`@melodicdev/core/devtools`): `isDevMode`, `setDevMode`, `devWarn`, `resetDevWarnings`, `installConsoleApi`, `createConsoleApi`, `getHook`, `emitDevtools`, `devtoolsListening`, `resetHook` | The dev-mode switch and the in-page hook — see [BOOTSTRAP.md](./BOOTSTRAP.md#the-melodic-console-api). The first five are also exported from `@melodicdev/core`; `createConsoleApi`, `getHook`, `emitDevtools`, `devtoolsListening` and `resetHook` (which clears the resolved hook, for tests) only from the `devtools` entry |

Types that go with them: `IDirectiveResult`, `IDirectiveState`, `AttributeDirectiveFunction`,
`AttributeDirectiveCleanupFunction`, `FormControlAdapter`, `AdapterPredicate`,
`ISignalEffectOptions`, `IRegisteredComponent`, `IUrlParts`, `IViteEnv`, and from the
`devtools` entry `IMelodicDevtoolsHook`, `IHookEvent`, `HookEventType`, `IComponentRecord`,
`IMelodicConsoleApi`, `IComponentInspection`.

---

## Internal

Exported for cross-entry use inside the framework. No guide covers them, and their
behaviour may change in a minor release:

`SIGNAL_MARKER`, `TemplateResult`, `RouteContextService`, `RouteContextEvent`,
`ROUTE_CONTEXT_EVENT`, `InjectionEngine`, `Binding`, `getTokenKey`, `describeToken`,
`RX_INIT_STATE`, `RX_ACTION_PROVIDERS`, `RX_EFFECTS_PROVIDERS`, `RX_STATE_DEBUG`.

Types, exported for typing only: the `ITemplatePart` family (`ITemplatePart`,
`TemplatePartType`, `IKeyedArrayItem`, `ITemplateCache`, `IRenderedContainer`,
`RenderedContainer`), `IDependent`, `IProducer`, `DEPENDENTS` (type-only),
`IRouteContext`, `IRouteContextChangeEvent`, `IResolvedRoute`, `IRouterEventState`,
`RouterStateEvent`, `TokenKey`, `BindingType`, `IDependency`, `IInjectableMeta`,
`ActionIdentifierPattern`, `NonEmpty`.

If you find yourself needing one of these in application code, that is usually a gap in the
application API — please open an issue rather than building on it.

### Deprecated

Still exported and working, but marked `@deprecated` in source. Do not use them in new code:

| Export | Use instead |
|---|---|
| `repeatRaw` | `repeat` |
| `RouteContextEvent`, `ROUTE_CONTEXT_EVENT`, `IRouteContextChangeEvent` | The `RouterService` signals (`params`, `queryParams`, `resolvedData`, `events`) and the `onRouteChange` hook |
| `ITemplatePart.renderedContainers` | Nothing; internal bookkeeping |
| `IRequestConfig.abortController` | `IRequestConfig.signal` |
