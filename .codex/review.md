# Melodic Framework Review

## Findings
- **Signals lose dynamic dependencies**: `signal()` subscribes effects to `activeEffect.execute` directly, so reruns happen outside a tracking context and dynamic dependencies can drop (`src/signals/functions/signal.function.ts`, `src/signals/signal-effect.class.ts`). Subscribing to `effect.run` or wrapping reruns with `setActiveEffect` would keep dependency graphs accurate.
- **Template values stringify objects**: Node parts turn non-directive values into `textContent`, so passing `TemplateResult`, `Node`, or arrays ends up as `[object Object]` instead of composed DOM (`src/template/template.ts`). Detect nested templates/nodes and render/insert them.
- **Attribute booleans stringify**: Attribute parts always set the attribute string, so `disabled=${false}` still disables elements by setting `"false"` (`src/template/template.ts`). Treat booleans specially (set/remove) and ignore `undefined`.
- **Router global patching and leaks**: `RouterService` monkey-patches `history.pushState/replaceState` at module load and never restores them; `router-outlet` adds global listeners without removal on disconnect (`src/routing/services/router.service.ts`, `src/routing/components/router-outlet/router-outlet.component.ts`). Repeated mounts can leak listeners and surprise host apps; wrap patches in lifecycle and clean up.
- **repeat directive clears ranges each update**: It removes everything between markers then reinserts nodes, causing full DOM churn (`src/template/directives/repeat.directive.ts`). A keyed diff that moves existing nodes would scale better.

## Ideas for Improvements and New Features
- **Templating**: Support nested `TemplateResult`/`Node` values, boolean attributes, and spread helpers; add SSR/hydration hooks; introduce a small scheduler to batch renders.
- **Signals**: Fix dependency tracking noted above; add effect cleanup and optional equality checks for computed values; allow microtask batching.
- **Router**: Expose params/query to components, add guards/resolvers and nested routes, honor modifier-click in `router-link`, support base/hash paths and scroll restoration, and active-link state.
- **DI**: Provide hierarchical injectors (per component subtree) and provider scopes on components/routes; allow async factories.
- **HTTP**: Add timeouts, cancellation helpers, retries/backoff, response caching, and safer JSON parsing; surface upload progress and typed errors.
- **Tooling**: Dev error overlay/logging hooks, testing utilities for components/signals, and a starter UI kit (modal/toast/form controls) to showcase patterns.
