# Roadmap — planned framework capabilities

Items identified in the 2026 full-repo review as worth building, but out of scope for the 3.0 remediation release. Tracked here so they get designed deliberately rather than bolted on.

## Framework capabilities

- **Auto-registered `effect()`** — a companion to `computed()` that creates and runs a `SignalEffect` bound to the current component's lifetime (disposed on destroy), removing the manual `new SignalEffect(...)` / `run()` ceremony.
- **Hierarchical / child injectors** — scoped providers per component subtree (route-level services, per-dialog scopes). Requires defining resolution order and disposal semantics.
- **Router event stream** — `NavigationStart` / `NavigationEnd` / `NavigationCancel` / `NavigationError` observable or signal on `RouterService`, now feasible since 3.0 consolidated the pipeline in one place.
- **Typed custom-event emit helper** — `emit<T>(host, 'ml:change', detail, options)` with a declared event map per component, replacing hand-rolled `dispatchEvent(new CustomEvent(...))` and standardizing `composed`/`bubbles` defaults.
- **SSR / jsdom-free testability** — remove module-top-level `window` / `document` access (`src/config/environment.ts`, remaining routing entry points) behind lazy accessors so the packages can at least be imported in a server context.

## Standard decorators migration (major release)

Migrate from `experimentalDecorators` to TC39 standard decorators. This is **viral**: consumers' tsconfigs are currently locked to the legacy flag by our types. It requires an `accessor`-based redesign of property observation (the current `observe()` getter/setter replacement doesn't map 1:1), so plan it as the headline of the next major (4.0) rather than a patch. Prerequisite spikes:

1. `accessor` field semantics vs. the current `observe()` (initial-value capture, `propertyTypes` coercion, host exposure).
2. Decorator metadata (`Symbol.metadata`) as the replacement for the current static/prototype bookkeeping in `@MelodicComponent`, `@Inject`, `@Service`.
3. A compatibility story (can one release support both modes?).

## Deliberate non-changes

- **`sideEffects: false`** — evaluated and rejected: importing a component module registers its custom element, which is a load-bearing side effect. Bundler tree-shaking must not drop those imports.
- **Trusted Types** — template values never reach the HTML parser (text nodes / `setAttribute` only), so the win is limited to the static template markup itself; deferred until there's consumer demand (noted at the parse site in `template-result.class.ts`).
