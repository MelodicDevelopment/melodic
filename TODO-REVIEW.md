# Full-Repo Review — Action Items

Findings from a whole-repo review (2026-06-09), merged with a second six-agent deep review (2026-07-05) covering core template/signals, core app layer, components (forms/overlays + data/nav/theme/utils), CLI/packaging, and a dedicated security sweep. Items new in the second review are tagged **[NEW]**; unmarked items are from the original review (the second review independently re-confirmed the P0s). Organized by priority; file references point at the offending code. Check items off as they land. **Remediation plan at the bottom.**

## P0 — Correctness bugs with real user impact

- [ ] **Effect exceptions corrupt global tracking state permanently**
  `src/signals/classes/signal-effect.class.ts:61-66` — `runNow()` calls `setActiveEffect(this); this.execute(); setActiveEffect(prevEffect)` with no `try/finally`. A throwing template/computed leaves `activeEffect` pointing at the dead effect forever and `_isRunning` stuck `true`.
  **Fix:** wrap `this.execute()` in `try/finally` restoring `prevEffect`; reset `_isRunning` in a `finally` around the do/while.

- [ ] **Directive/event cleanups never run for content removed by `when`, `repeat`, or nested templates**
  - `src/template/classes/template-result.class.ts:503-512` — `clearRenderedNodes()` drops `part.nestedContainer` without running `cleanupParts()` on its `__parts`.
  - `src/template/directives/builtin/when.directive.ts:136-142` — `removeContent()` removes nodes without cleanup. Every false→true→false toggle of a `when` containing `:formControl` or `clickOutside` leaks subscriptions/document listeners.
  - `src/template/directives/builtin/repeat.directive.ts:229-241` — `removeItemRange()` same problem for removed items.
  - `src/components/classes/component-base.class.ts:141-154` — `teardown()` only walks top-level `__parts`; nested containers are invisible.
  *2026-07-05 confirmation:* traced end-to-end against `:formControl` (`src/forms/directives/form-control.directive.ts:76-91` — three signal subscriptions + input/blur listeners leak per removal), `:tooltip`, `:portal`. Leak fires on both removal AND host destroy.
  **Fix:** make part disposal recursive (a `dispose()` that walks `nestedContainer.__parts`, array items, and directive state) and call it from all four sites.

- [ ] **[NEW] `when` loses updates when the branch template's STRUCTURE changes**
  `src/template/directives/builtin/when.directive.ts:94-109` — on the still-true/still-false path, `newTemplate.renderInto(previousState.container)` targets the fragment whose children were already moved into the DOM (`renderContent:130-133`). If the returned template has a different `templateKey` (e.g. `when(open, () => cond ? html\`<a>\` : html\`<b>\`)`), `renderInto` takes its first-render branch and builds the new nodes INSIDE the detached fragment — the DOM silently keeps the old structure.
  **Fix:** detect templateKey change and re-insert between the markers (mirror `renderNestedTemplate`, `template-result.class.ts:601-614`).

- [ ] **[NEW] Switching a node binding between two directive types passes stale state**
  `src/template/classes/template-result.class.ts:814-816` — the directive→directive transition calls `value.render(part.node, part.directiveState)` with the PREVIOUS directive's state. `${cond ? repeat(items,…) : when(true,…)}` hands a `WhenState` to `repeat`, which skips setup and crashes/corrupts. directive↔non-directive transitions are handled; directive-type switches are not.
  **Fix:** stamp state with the owning directive identity; on mismatch, run old cleanup and pass `undefined`.

- [ ] **Guards run twice per programmatic navigation; resolver skip-flag is fragile**
  `src/routing/services/router.service.ts:217-240` runs guards/resolvers, then `pushState` → `NavigationEvent` → outlet `matchAndRender()` runs guards **again** (`src/routing/components/router-outlet/router-outlet.component.ts:239-252`). The `_resolversExecutedForPath` flag compares raw strings and misses on path normalization differences (double data fetch).
  **Fix (architectural):** move the whole match→guards→resolvers→commit pipeline into `RouterService` (including popstate); outlets become dumb renderers reacting to a committed-route signal. Deletes the skip-flag and the outlet's guard call.

- [ ] **Numeric attributes never coerced — `offset` silently broken on ml-popover/ml-dropdown**
  `src/components/classes/component-base.class.ts:118-127` only coerces booleans. `<ml-popover offset="12">` passes the string into `offset.middleware.ts:14-16`'s object branch → resolves to 0. Pagination defends with `Number()` everywhere (`pagination.component.ts:38-40, 74-84`).
  *2026-07-05 addendum:* boolean coercion itself only applies when the property's INITIAL value was a boolean (`component-base.class.ts:115-134`) — `open?: boolean` (initially undefined) gets the raw string `"false"` (truthy).
  **Fix:** add a `_numberProperties` set in `ComponentBase` mirroring boolean handling; coerce by declared type, not initial-value type; delete per-component `Number()` boilerplate.

- [ ] **[NEW] Config env overrides shallow-merge while `extends` deep-merges**
  `src/config/define-config.ts:40` — `{ ...definition.base, ...envOverrides }` is one level deep, but `extends` (line 43) uses `deepMerge`. `base:{api:{url,timeout}}` + `prod:{api:{url}}` yields `api:{url}` — `timeout` silently lost.
  **Fix:** deep-merge env overrides too (one merge strategy everywhere).

- [ ] **`DialogRef.afterClosed` never fires on Escape-dismiss**
  `packages/melodic-components/src/components/overlays/dialog/dialog-ref.class.ts:62-86` — callback only fires from `close()`; Escape takes native `cancel` → `close` → `DialogService.cleanUpDialog` and skips it (descendant-popover cleanup also skipped).
  **Fix:** have `DialogRef` listen to the dialog's native `close` event and fire the callback there (guard double-fire). Also consider supporting multiple `afterOpened`/`afterClosed` registrations (currently single-callback, silently replaced).

- [ ] **[NEW] `ml-table` selection is stale/positional — never cleared when `rows` changes**
  `packages/melodic-components/src/components/data-display/table/table.component.ts:120-124` — `onPropertyChange` invalidates the scroller but does NOT reset `selectedIndices` on `rows` change; data-grid does (`data-grid.component.ts:152-158`). Swapping rows (pagination/filter/live update) leaves old indices highlighting the wrong rows and `ml:select` reporting the wrong set. Compounded: indices are `sortedRows`-relative (template passes `startIndex+i`, `table.template.ts:85-102`) so they don't map to consumer row order under sort.
  **Fix:** mirror data-grid's reset; define the selection contract (emit rows or original-order indices). Root cause is the table/data-grid fork — see extraction item in P2 Components.

- [ ] **[NEW] Avatar image-error fallback is dead code**
  `packages/melodic-components/src/components/data-display/avatar/avatar.component.ts:44-48` — `_imageError` is `_`-prefixed → excluded from reactivity, so `handleImageError` never triggers a re-render and `when(!!c.src && !c._imageError, …)` never re-evaluates. Broken `src` shows a broken-image glyph forever; initials never appear.
  **Fix:** rename to a reactive prop; also reset it on `src` change.

- [ ] **[NEW] Pagination renders duplicate pages + spurious ellipsis for small totals**
  `packages/melodic-components/src/components/navigation/pagination/pagination.component.ts:55-62` — verified: `page=1 total-pages=4 siblings=1` → `[1,2,3,4,…,4]` (page 4 twice, duplicate `page-4` repeat keys corrupt keyed reconciliation, `pagination.template.ts:24`). Symmetric on the right branch; `total-pages=5` → ellipsis hiding zero pages.
  **Fix:** short-circuit `if (2*siblings + 5 >= total) return range(1, total);` before the ellipsis logic.

- [ ] **[NEW] Autocomplete async search race — stale responses overwrite newer results**
  `packages/melodic-components/src/components/forms/autocomplete/autocomplete.component.ts:443-453` — `this.asyncOptions = await this.searchFn(query)` with no sequencing/cancellation; a slow earlier request resolving late shows results for the wrong query.
  **Fix:** request-generation counter; ignore resolutions that aren't the latest.

- [ ] **CLI monorepo scaffold is dead on arrival under Vite**
  `packages/cli/templates/monorepo-basic/apps/__APP_NAME__/` — app imports `@config`, which exists only in root tsconfig `paths`; Vite has no matching `resolve.alias`, so `npm run dev` fails on a fresh `melodic init --monorepo`. Same for every `melodic add lib` (`packages/cli/src/index.ts:183-229, 289-326`).
  **Fix:** add matching `resolve.alias` entries to the app vite.config template and keep them updated from `addLib`/`addApp` — or drop tsconfig path aliases and import via workspace package names with proper `exports` maps. Make tsconfig and Vite agree on one strategy.

- [ ] **[NEW] CLI `generate`/`add` path traversal — names and `--path` unsanitized**
  `packages/cli/src/index.ts:426-497` (routed from 575-599) — `melodic generate component ../../evil` passes through `toKebabCase` unchanged and `path.join` normalizes the `..`, writing files OUTSIDE the project root; same via `--path`. Also covers quote-breakout into generated source (`melodic g service "o'brien"` → syntax-broken file; `index.ts:127-134,468-475`). No shell is ever invoked (verified — zero `child_process`), so this is file-write/malformed-output, not command injection.
  **Fix:** validate names against `^[a-z][a-z0-9-]*$`, reject path separators/`..` in names and `--path`; escape interpolated values.

- [ ] **CLI `generate interceptor` emits code that fails typecheck against v2 API**
  `packages/cli/src/index.ts:484` — generates `error: async (error: Error): Promise<unknown>`; v2 interface (`src/http/interfaces/ihttp-response-interceptor.interface.ts`) requires `(error, context) => Promise<IHttpResponse<T> | void>`.

- [ ] **CLI `generate component` can produce an invalid custom element selector**
  `packages/cli/src/index.ts:426-447` — `melodic g component card` → `selector: 'card'` → `customElements.define` throws. Error or auto-prefix when the kebab name has no hyphen; validate in the decorator too (`src/components/decorators/melodic-component.decorator.ts:49`).

- [ ] **`@melodicdev/core` root index omits forms**
  `src/index.ts` exports ten modules but not `export * from './forms';` — the only subpath module excluded. Add it (or document why it's intentional).

## P1 — Security hardening [NEW section]

*2026-07-05 security sweep verdict: no critical/high vulnerabilities. Template engine verified XSS-safe (values never enter parsed markup; text via `createTextNode`/`textContent`, attributes via `setAttribute`; attribute/event names only from static template text). Router `pushState` can't open-redirect cross-origin. No `eval`/`exec`/ReDoS. Items below are misuse-prone APIs and defense-in-depth.*

- [ ] **[NEW] `routerLink` accepts `javascript:` URLs — protocol-validate**
  `src/routing/directives/router-link.directive.ts:82,124` — value is assigned to `anchor.href` and passed to `window.open()` with no scheme check; `window.open("javascript:…")` on a modified-click is direct script exec if the target is ever data-driven (route params, API data). Same class: `action-href` on `ml-page-section` (`packages/melodic-components/src/components/sections/page-section/page-section.template.ts:21`).
  **Fix:** allow only http(s)/relative before assigning href or calling `window.open` (Angular-style sanitization).

- [ ] **[NEW] `.innerHTML=${…}` property binding is a one-line XSS footgun**
  `src/template/classes/template-result.class.ts:895` — property binding assigns `node[name] = value` for any name; `.innerHTML`/`.outerHTML` bypass the safe text path while looking like a normal bind.
  **Fix:** dev-mode warn (or block) `innerHTML`/`outerHTML` property names; document the hazard next to `unsafeHTML`.

- [ ] **[NEW] `deepMerge` lacks prototype-pollution guards**
  `src/config/define-config.ts:12-34` — `result[key] = …` for every own source key. Inert today (dev-authored literals), exploitable the moment config comes from `JSON.parse` (which DOES produce an own `__proto__` key).
  **Fix:** skip `__proto__`, `constructor`, `prototype` keys.

- [ ] **[NEW] Theme name/values interpolated unsanitized into CSS**
  `packages/melodic-components/src/theme/functions/create-theme.function.ts:14` — `[data-theme="${name}"]` — a name containing `"]{…}` injects arbitrary CSS rules (no script exec; dev-controlled → low).
  **Fix:** validate name against `^[a-z0-9-]+$`; escape override values.

- [ ] **CLI name validation** — covered by the P0 path-traversal item above (listed here for the security checklist).

## P1 — Accessibility (components library)

- [ ] **Radio group has no arrow-key navigation**
  `packages/melodic-components/src/components/forms/radio/radio-group.component.ts` — each radio's native input is in its own shadow root so native grouping doesn't apply; `role="radiogroup"` is set but no keydown handler exists. Every radio is a Tab stop; arrows do nothing. Copy the roving-tabindex pattern from `tabs.component.ts:146-181`.

- [ ] **Select/autocomplete/dropdown keyboard focus invisible to screen readers**
  `select.template.ts`, `autocomplete.template.ts:78-146`, `dropdown.template.ts:7` — arrow-key "focus" is CSS-only: no option `id`s, no `aria-activedescendant`. Autocomplete input is missing the combobox pattern entirely (`role="combobox"`, `aria-expanded`, `aria-controls`, `aria-autocomplete`). Dropdown trigger lacks `aria-haspopup`/`aria-expanded`. Use `newID()` for option ids.
  *2026-07-05 addendum:* select's `aria-labelledby=${c.label ? 'label' : ''}` (`select.template.ts:35`) references a nonexistent id — the combobox has NO accessible name; empty-string attribute rendered when unlabeled. Give the label an id (radio-group's `legend` pattern) and omit the attribute when absent.

- [ ] **`focusTrap` is broken inside shadow DOM — and no component uses it (or `announce`)**
  `packages/melodic-components/src/utils/accessibility/focus-trap.ts:38,44` — compares `document.activeElement` (always the host) instead of `(container.getRootNode() as Document | ShadowRoot).activeElement`. Fix the util, then actually adopt it (popover should trap/restore focus; it does neither).

- [ ] **Tooltip a11y + positioning gaps**
  `overlays/tooltip/` — no `role="tooltip"` link (`id` + `aria-describedby` on trigger), no Escape-to-dismiss (WCAG 1.4.13), and no `autoUpdate` so a visible tooltip drifts on scroll. Also `icon.template.ts:9` should set `aria-hidden="true"` on the ligature text.
  *2026-07-05 addendum:* tooltips never show on keyboard focus at all — `@focus`/`@blur` are bound to the shadow wrapper (`tooltip.template.ts:7-15`) but the focusable element is slotted light DOM, and `focus` doesn't bubble. Use `focusin`/`focusout`.

- [ ] **ml-button: `role="button"` on host + non-functional `type="submit"`**
  `forms/button/button.component.ts:67-72,44` — host role wraps a real `<button>` (button-in-button for SRs); drop it. `type="submit"` does nothing without form association — implement `ElementInternals` (`internals.form.requestSubmit()`) or document the limitation.

- [ ] **[NEW] form-field sets slotted-control ARIA once and never re-syncs**
  `packages/melodic-components/src/components/forms/form-field/form-field.component.ts:87-122` — `connectSlottedControl` runs only in `onCreate`/`slotchange`; when error/hint/required/disabled change reactively (e.g. validation error after submit), `aria-describedby`/`aria-invalid`/`aria-required` go stale and are never removed when the error clears. Also `describedBy` drops the hint id when both error and hint are set. Re-sync in `onRender` (radio-group pattern).

- [ ] **[NEW] Circle/half-circle progress invisible to screen readers; `aria-valuenow` unclamped**
  `packages/melodic-components/src/components/feedback/progress/progress.template.ts:54-135` — only `linearTemplate` sets `role="progressbar"` + aria values. Also `aria-valuenow=${c.value}` (line 34) uses the raw value while the visual clamps to 0–100 (`component:55-58`) — `value="150"` exceeds `aria-valuemax`. Add role/values to all shapes; use the clamped value.

- [ ] **[NEW] Tabs/steps `repeat` key encodes active state → arrow-key navigation drops focus to `<body>`**
  `packages/melodic-components/src/components/navigation/tabs/tabs.template.ts:26` & `steps.template.ts:27` — key is `` `${value}-${active}` ``; selection flips the key on old+new tab so `repeat` destroys/recreates them, and the async re-render destroys the just-focused button. Defeats roving tabindex; needless DOM churn. Key by value alone. (Same anti-pattern ships in the CLI starter app — see P2 CLI.)

- [ ] **[NEW] Slotted-mode tabs/steps/sidebar never move keyboard focus**
  `tabs.component.ts:223-227`, `steps.component.ts:263-267`, `sidebar.component.ts:135-169` — `focusTab`/`focusStep`/sidebar keydown query `[data-value=…]` in the shadow root, which only exists in config mode. In slotted mode arrows change active state but focus stays put. Query slotted hosts (and delegate focus) too.

- [ ] **[NEW] Dropdown/date-picker steal focus back to trigger on pointer light-dismiss**
  `overlays/dropdown/dropdown.component.ts:122`, `forms/date-picker/date-picker.component.ts:164` — the toggle→close branch restores trigger focus unconditionally, yanking focus away from whatever the user just clicked. Restore only for keyboard/inside-overlay dismissals.

- [ ] **[NEW] `announce()` clobbers rapid successive messages**
  `packages/melodic-components/src/utils/accessibility/live-region.ts:39-50` — fixed 50ms clear+set; overlapping calls cancel earlier announcements. Queue messages or debounce per politeness level.

- [ ] **[NEW] Misc ARIA gaps** — `ml-list-item` `interactive` is styled clickable but has no `tabindex`/`role`/key handling (its focus-visible rule is dead); tab/panel and step/panel pairs lack `id`/`aria-controls`/`aria-labelledby` association.

## P1 — Component consistency sweep

- [ ] **Event vocabulary contract.** Dismissal is `ml:dismiss` (alert/toast) vs `ml:close` (tag) vs `ml:remove` (file-upload-item) — standardize. Internal coordination events (`ml:item-click`, `ml:tab-click`, `ml:card-select`, `ml:sidebar-item-click`, `ml:step-click`) leak out composed without `stopPropagation` (dropdown stops its own at `dropdown.component.ts:130`; others don't). Worst: `radio-group.component.ts:80-99` re-emits child `ml:change` without stopping the original — two `ml:change` events per click.

- [ ] **ml-dialog and ml-popover emit no lifecycle events** while drawer/dropdown/select/autocomplete all fire `ml:open`/`ml:close`. Add them (popover's `handleToggle`; dialog's native `close` event).

- [ ] **[NEW] Non-reactive slot-presence getters — systemic sweep**
  card (`card.component.ts:43-50`), page-header (`:51-77`), page-section (`:53-55`), divider (`:32-34`), list-item (`list-item.component.ts:43-50`), activity-feed-item (`:63-70`) all compute `hasX` via `querySelector` at render time with no `slotchange` wiring — and the `<slot>` sits inside a `when(…)`, so content inserted after mount NEVER projects. profile-card (`profile-card.component.ts:83-96`) does it right; make its `slotchange` pattern the standard everywhere.

- [ ] **CSS token convention violations** (per CLAUDE.md's own rules; `button.styles.ts` is the gold standard):
  - `badge.styles.ts:61-79` — hardcoded paddings, global tokens referenced directly in rules; variant colors defined in `theme/tokens/colors.tokens.ts:179-197` instead of `:host`.
  - `tooltip.styles.ts:11,18,37` — combined `--ml-tooltip-transition`, hardcoded `z-index: 9999`, and the documented theme-vs-component namespace collision on `--ml-tooltip-bg`.
  - `pagination.styles.ts:17,61` — combined transition; raw `var(--ml-space-2)` in a rule.
  **Systemic fix:** give theme-level knobs a distinct namespace (e.g. `--ml-theme-*`) so `:host` blocks can alias them safely; sweep older components to the button pattern.

- [ ] **Eight components observe the reserved global `title` attribute** (alert, toast, hero-section, page-header, page-section, login/signup/dashboard pages) — causes native hover tooltips (ToastService also sets native `title` via `setAttribute`, `toast.service.ts:37`). Migrate to prefixed names (`ml-table` already uses `table-title`) with a deprecation shim.

- [ ] **`ml-checkbox`/`ml-toggle` have no `error` attribute**, so the forms system's "validator messages auto-populate `error`" contract silently fails for required checkboxes. Add `error` + rendering to both (button-group too).

- [ ] **Undocumented exports:** `ml-time-picker`, `ml-file-upload` (no `registerAdapter` either — can't bind `:formControl`), and the three page components (`ml-login-page`, `ml-signup-page`, `ml-dashboard-page`) appear in zero docs and aren't in CLAUDE.md's inventory. Document or de-export; add `docs/components/pages.md`.

- [ ] **Drawer lifecycle events fire before animations finish** (`drawer.component.ts:95-112`) and animation duration/easing are hardcoded instead of tokens. Consider `ml:open`/`ml:opened`, `ml:close`/`ml:closed` pairs.

- [ ] **`createBrandTheme` produces unusable colors in dark mode** (`theme/functions/create-theme.function.ts:48-53`) — `-subtle` always mixes toward white. Add a `mode: 'light' | 'dark'` option.

- [ ] **[NEW] date-picker layers a custom calendar popover on a native `type="date"` input** (`date-picker.template.ts:21-35,48-57`) — clicking the field can surface BOTH pickers. Switch the input to `type="text"` with parse/format, or drop the custom calendar.

## P2 — Framework improvements

- [ ] **State: `dispatchWithoutKey` effects lack `.catch`** (`signal-store.service.ts:145-159`) — its twin `dispatchWithKey` (108-129) was already fixed. Extract a shared `runEffects` helper.

- [ ] **[NEW] State: effects discovered via reducer-map keys — effect-only slices never fire on keyless dispatch**
  `signal-store.service.ts:198-213` — `getEffectsForActionWithoutKey` iterates `Object.keys(this._reducerMap)` then looks up `_effectMap[key]`; a slice registered in `effectMap` but not `reducerMap` is skipped entirely. Iterate the union (fold into the `runEffects` extraction above).

- [ ] **State: keyless dispatch only hits the first matching slice** (`signal-store.service.ts:163-178, 195-214`) — an action registered in two slices (e.g. `logout`) updates only one, plus linear-scan perf. *2026-07-05 addendum:* effect-produced actions from a KEYED dispatch are re-dispatched keyless (`:121,156`), so they inherit this first-slice-wins bug regardless of which slice owned the effect. Build a `Map<actionType, Array<{key, reducer}>>` index at `provideRX` time; apply all matches inside `batch()`.

- [ ] **[NEW] HTTP: retried requests run later response interceptors twice**
  `http-client.class.ts:138-151` — `retry()`'s `internalRequest()` already runs the FULL interceptor chain on the new response; `handleResponseError` then re-runs interceptors `[i+1..n]` on that already-intercepted response. Data-unwrap/logging interceptors apply twice on every retry. Skip the re-run (or have retry return a raw response).

- [ ] **HTTP: dedup runs response interceptors N times on one shared response; later callers' abort controllers ignored** (`http-client.class.ts:200-264`, `request-manager.class.ts:38-49`). Dedupe the post-interceptor promise; ref-count cancellation with `AbortSignal.any`.

- [ ] **HTTP: error-interceptor exceptions silently swallowed** (`http-client.class.ts:147-155`) — "catch HttpError, throw domain error" is impossible. Rethrow the last interceptor-thrown error, or add `context.replaceError()`.

- [ ] **[NEW] HTTP: supplying `onProgress` silently changes text responses to Blob**
  `http-client.class.ts:360-392` — the progress branch only special-cases JSON; `text/*` returns a Blob instead of the string the non-progress path returns. Honor content-type in both paths.

- [ ] **[NEW] Routing: `:param` matches an empty segment** (`route-matcher.class.ts:49-51`) — compiles to `([^/]*)`; a top-level `{path:':id'}` matches the root URL with `id=''`. Use `([^/]+)`.

- [ ] **[NEW] Routing: no sibling backtracking after a failed child match** (`match-route-level.function.ts:69-97`) — once a parent prefix-matches, the function returns the child recursion even when it 404s, never trying later siblings (e.g. `[{path:'a',children:[b]},{path:':x',children:[c]}]` with URL `a/c`). Backtrack to remaining siblings on child-match failure.

- [ ] **[NEW] Routing: path building doesn't URL-encode params** (`build-path-from-route.function.ts:11`, `route-matcher.class.ts:131-142`) — raw `String.replace` with the param value: `/` breaks segment structure, spaces unencoded, and `$`-sequences in values are mangled by replace semantics. `encodeURIComponent` + replacer-function form.

- [ ] **[NEW] Routing: `navigate()` builds `?a=1?b=2` when path already has a query** (`router.service.ts:177-181`) — unconditional `` `${path}?${params}` ``; merge with `includes('?') ? '&' : '?'` (HttpClient's `buildUrl` already does this).

- [ ] **Reactive sources are a construction-time snapshot** (`component-base.class.ts:259-271`) — reassigning `this.form = createFormGroup(...)` in `onCreate` silently breaks reactivity and leaks the old subscription. Wrap signal/control fields with a swapping setter, or warn on reassignment.

- [ ] **Attribute → property reflection drops values and lacks numeric coercion** (`component-base.class.ts:115-134`) — only assigns when the current value `!== undefined`; coercion depends on initial value type. Track declared props from metadata; coerce by declared type; skip render on `Object.is`-equal. (Coercion halves promoted to P0 above.)

- [ ] **`computed()` is eager and writable** (`src/signals/functions/computed.function.ts:6-29`) — recomputes on every source change even unread; still exposes `.set()`/`.update()`. Implement lazy (dirty-flag) computeds; return `ReadonlySignal<T>` (also apply to `select()`).

- [ ] **`@Inject` metadata array shared across the inheritance chain** (`src/injection/decorators/inject.decorator.ts:5-11`) — `target.params` found via prototype chain; subclasses mutate the parent's array. Use `Object.getOwnPropertyDescriptor` or a `WeakMap<ctor, tokens[]>`.

- [ ] **[NEW] `@Service` getter caches by truthiness** (`src/injection/decorators/service.decorator.ts:13`) — `if (!(this)[cacheKey])` re-resolves on every access for falsy resolutions (a transient/factory binding returning falsy is re-constructed each access). Use an `in`/sentinel check.

- [ ] **`history` monkey-patching at module import** (`router.service.ts:36-55`) — unconditional, un-unpatchable, double-patch risk; also the mechanism behind the double-guard P0. Move into `provideRouter()` init with an idempotence guard; longer-term, adopt the Navigation API.

- [ ] **Event parts re-bind every render; no listener options** (`template-result.class.ts:900-918`) — attach one stable wrapper listener per part and swap `previousValue`; accept `{handleEvent, ...options}`.

- [ ] **[NEW] Composite-attribute "unchanged" fast-path corrupts `previousValue`** (`template-result.class.ts:850-861,962`) — the skip-path falls through to `part.previousValue = value` (single segment value overwrites the composed string), so the skip never fires again and `setAttribute` runs every render. Perf only; `continue` like the changed-path does.

- [ ] **Per-instance `<style>` element instead of shared constructed stylesheet** (`component-base.class.ts:172-181`) — build one `CSSStyleSheet` per component class and adopt it per instance (global styles already do this).

- [ ] **`router-link` defeats native modifier-click behavior** (`router-link.component.ts:54-64`) — return early without `preventDefault` on ctrl/cmd/shift/middle click; handle `auxclick`. *2026-07-05 addendum:* the element and the `:routerLink` directive are two near-complete, independently-drifting implementations (directive handles modifier clicks correctly at `router-link.directive.ts:118-126`) — consolidate on one core.

- [ ] **`select()` default cache key is `selectFn.toString()`** (`signal-store.service.ts:52`, `component-state-base.service.ts:49`) — distinct closures can stringify identically (esp. minified) and return the wrong cached signal. Key by function identity via `WeakMap`; require explicit `cacheKey` otherwise.

- [ ] **HTTP timeout plumbing:** replace hand-rolled `setTimeout` + shared controller (`http-client.class.ts:210-216`) with `AbortSignal.timeout()` + `AbortSignal.any()`; accept a plain `signal?: AbortSignal` in `IRequestConfig`.

## P2 — Components library (new 2026-07-05)

- [ ] **[NEW] Positioning: `shift()` axis options are inert and main axis always clamps**
  `packages/melodic-components/src/utils/positioning/middlewares/shift.middleware.ts:31-42` — both clamps are gated by `if (crossAxis || mainAxis)` (always true); `crossAxis:false` does nothing, and main-axis clamping (floating-ui defaults it OFF) pulls a bottom-placed element up OVER its trigger near the viewport edge instead of letting `flip` handle it. Gate each axis by its own flag; default mainAxis off.

- [ ] **[NEW] Positioning: `flip()` discards a prior `offset()`**
  `.../middlewares/flip.middleware.ts:77` — recomputes the raw base position for the fallback placement, losing the applied offset; with `[offset(8), flip()]` the 8px gap disappears after flipping. Re-run earlier middleware (or carry the offset) on flip.

- [ ] **[NEW] `autoUpdate` never runs an initial `update()`** (`.../positioning/auto-update.ts`) — floating-ui does; first paint is unpositioned unless callers invoke manually.

- [ ] **[NEW] `clickOutside` fails across shadow boundaries**
  `packages/melodic-components/src/utils/directives/click-outside.directive.ts:9-12` — document-level `event.target` is retargeted to the outer host, so `element.contains(target)` is false for clicks INSIDE a shadow-hosted element → spurious "outside" close. Use `event.composedPath().includes(element)`.

- [ ] **[NEW] data-grid: `currentPage` not clamped when `rows` shrink externally** (`data-grid.component.ts:147-159,252-256`) — replacing `rows` with a smaller set can leave "Page 5 of 2" and a blank grid (internal filter/sort reset the page; external replacement doesn't). Clamp on rows change.

- [ ] **[NEW] data-grid: resizing a sortable column can trigger a sort** (`data-grid.template.ts:79,97-104`) — the resize handle is a child of the sortable `<th>` and doesn't stop the synthesized click. `@click=${e => e.stopPropagation()}` on the handle.

- [ ] **[NEW] select/autocomplete reposition once on open — no resize handling** (`select.component.ts:345-376`, `autocomplete.component.ts:471-501`) — single `computePosition`; viewport resize while open misaligns the menu (dropdown/popover/date-picker correctly use `autoUpdate`). Adopt `autoUpdate`.

- [ ] **[NEW] calendar-view: timezone-inconsistent date handling**
  `calendar-view.utils.ts:162-167` buckets events by raw ISO date-string while `:181-189` renders times via local `new Date(iso)` — a `…T23:00:00Z` event buckets on its UTC date but renders at shifted local time (wrong day/time pairing). Also midnight-crossing events yield `gridRowEnd < gridRowStart` (invalid CSS grid span), and `layoutOverlappingEvents` can over-count `totalColumns` (cosmetic width gaps). Pick one timezone basis for both bucketing and rendering; clamp spans to the day.

- [ ] **[NEW] DialogService robustness** (`dialog.service.ts:31-34,62-88`) — `open(id)`/`close()` use non-null assertions that throw opaque TypeErrors for unregistered ids (guard + warn); `addDialog` attaches a `close` listener per registration that's never removed (inline re-registers under the same id accumulate listeners on discarded elements until GC).

- [ ] **[NEW] `:tooltip` directive reparenting hazards** (`packages/melodic-components/src/directives/tooltip.directive.ts:44-56`) — moves the element into an `ml-tooltip` wrapper (can desync template part positions on re-render), sets `content` only at creation (dynamic `:tooltip=${value}` updates never propagate), and orphans the element if `parentNode` is null.

- [ ] **[NEW] slider fill hardcodes native thumb geometry** (`slider.component.ts:75-78`) — `calc(${p*100}% + ${10 - p*20}px)` assumes a 20px thumb; themed thumb sizes misalign the fill. Derive from the same token.

- [ ] **[NEW] Extract shared table/data-grid core** — they re-implement the same pipeline (sortedRows, virtual-scroll wiring, spacers, selection, renderCell) twice and have already diverged (data-grid is the correct/complete one; table's missing selection reset is a P0 above). A shared base prevents the next divergence.

- [ ] **[NEW] Deduplicate popover/dropdown overlay plumbing** — `_justDismissed`/`setTimeout(0)` toggle-guard and `positionArrow()` are verbatim copies (`popover.component.ts:104-116,153-173` vs `dropdown.component.ts:104-127,326-346`), with the offset/flip/shift wiring echoed again in select/autocomplete/date-picker. Extract a shared overlay-positioning helper/mixin.

## P2 — CLI cleanup

- [ ] **Argument parser eats positionals after boolean flags** (`packages/cli/src/index.ts:31-55`) — `melodic init --monorepo my-repo` parses `my-repo` as the flag's value. Use a known-boolean-flags set or Node's `util.parseArgs`.
- [ ] **Delete or wire up dead `templates/basic/`** (~1,500-line unreferenced near-clone of app-basic). Update CLAUDE.md's template list.
- [ ] **`add app` produces an app inconsistent with the monorepo's seeded app** (`index.ts:280-327`) — copies `app-basic` with dev-tooling files the monorepo app doesn't have; also `copyTemplate`'s recursion drops the `exclude` param (`index.ts:99`). Add a `monorepo-app` template; thread `exclude` through.
- [ ] **Generated components don't follow the repo's own structure convention** — three flat files, no directory, no `index.ts` barrel, no `Component` suffix dedup (`UserCardComponentComponent`).
- [ ] **Template dependency pinning:** `"@melodicdev/core": "latest"` (non-reproducible) and `"vite": "^5.4.0"` (repo is on 7). Pin `^2.0.0` / current Vite.
- [ ] **Non-atomic generation + raw error leaks** (`index.ts:109-117, 136-142, 433-446`) — precheck all targets before writing; wrap fs/JSON errors with path + hint; use a JSONC-tolerant parser for tsconfig edits (comments are legal in tsconfig).
- [ ] **`add app`/`add lib` don't validate workspace root; names unsanitized** (`index.ts:280-338`) — require a workspaces `package.json`; kebab-case the name; don't scope user libs under `@melodicdev/`. (Name sanitization itself promoted to P0 — path traversal.)
- [ ] **Generator template quality:** directive generator emits `return undefined` (contradicts CLAUDE.md's "always return state") and snake_case identifiers; starter app's `repeat` key embeds mutable `completed` state (`templates/app-basic/src/components/app.component.ts:59`), defeating keyed reconciliation — key by `task.id` (same anti-pattern as the tabs/steps P1 a11y bug).
- [ ] **Missing generators:** `generate guard`/`resolver` (core ships `createGuard`); `add components`; `--force`/`--dry-run`; interactive prompts.
- [ ] **README drift:** says `--dir packages` (default is `libs`), wrong monorepo layout, omits `add config`/`version`/`g` alias.

## P2 — Infrastructure

- [ ] **Add CI** — no workflows exist. Minimum: lint + typecheck + test + build per package on push/PR, plus a scaffold smoke test (`melodic init` → `npm run build`) that would permanently catch CLI template drift. Add a release workflow later.
- [ ] **CLI and melodic-html packages have no test/lint/typecheck scripts and zero tests.** CLI snapshot tests of generated trees are cheap and would have caught the interceptor bug.
- [ ] **Component test coverage:** ~16 test files for ~72 components. Establish a baseline for the top-10 most-used (button, input, select, dialog, table…).
- [ ] **Version/doc drift:** align package versions (core 2.0.2 / components 2.0.3 / CLI 2.0.0); add CHANGELOG entries for 2.0.1–2.0.3; update README CDN URLs (still reference 1.3.2/1.0.4); add `engines` field; consider `"sideEffects": false` after auditing for top-level side effects.
- [ ] **Repo hygiene:** `src/forms/` is mode 700 and a couple of test files are mode 600 — `chmod 755`/`644` so collaborators aren't blocked.

## Smaller / opportunistic

- [ ] Template parser: document/throw-in-dev for unsupported binding positions (`<textarea>`, `<title>`, comments, tag-name position); make the 500-entry template cache LRU instead of FIFO; consider Trusted Types support (`template-result.class.ts:118-119, 168-169, 307-312`).
- [ ] **[NEW]** Non-keyed array interpolation fully tears down and rebuilds every node each render (`template-result.class.ts:698-719`) — by design (that's what `repeat` is for), but it destroys nested component state/focus silently; add a dev-mode warning or doc callout.
- [ ] **[NEW]** Pervasive `(container as any).__parts` / `directiveState?: any` in the template engine hides the part/state contract from the compiler — it's what let the `when`-structural and directive-switch P0s through. Type the part tree when touching those fixes.
- [ ] **[NEW]** `calendar.component.ts:257` — `isPlaceholder`'s second clause duplicates `!inRange`; simplify.
- [ ] `Size` type promises `xs`–`xl` but most components style only `sm/md/lg`; define per-component unions. Unify `error` vs `danger` variant naming.
- [ ] Routed tabs bypass the router (`tabs.component.ts:127-129` — raw `pushState` + synthetic `PopStateEvent` skips guards/resolvers).
- [ ] `ml-table` `ml:select` detail `selectedRows` contains sorted-order **indices**, and sorting silently clears selection without an event (`table.component.ts:239, 279-287`). (Selection-reset half promoted to P0.)
- [ ] Select in `multiple` mode can't be closed by clicking its trigger (`select.component.ts:222-227`).
- [ ] Missing framework capabilities to plan: auto-registered `effect()` companion to `computed()`; hierarchical/child injectors; router event stream (NavigationStart/End/Cancel); typed custom-event emit helper; SSR/jsdom-free testability (module-top-level `window`/`document` access in routing and `src/config/environment.ts:17`).
- [ ] Migrate from `experimentalDecorators` to TC39 standard decorators (viral: consumers' tsconfigs are locked to the legacy flag) — needs an `accessor`-based redesign, so plan as a major.

---

# Remediation Plan (2026-07-05)

Nine phases, ordered so that (a) the safety net lands first, (b) fixes with the widest blast radius land before the code they protect is churned, and (c) each phase is a coherent, independently shippable batch with its own regression tests. Sizes: S = under a day, M = 1–3 days, L = a week-ish.

**Phase 0 — Safety net (S–M).** Add CI (lint + typecheck + test + build per package, plus the `melodic init → npm run build` scaffold smoke test); fix `src/forms/` 700 / test-file 600 permissions. Every later phase lands with a net; the smoke test alone permanently retires the CLI-template-drift bug class.

**Phase 1 — Template engine core (M–L).** One workstream, all in `src/template` + `component-base`: SignalEffect `try/finally` → recursive part disposal (the leak family — biggest single fix in the repo) → `when` structural-change re-insertion → directive-type-switch state guard → composite-attribute `previousValue` fix. Type the part tree (`__parts`/`directiveState`) while in there — it's what let two of these through. Each fix gets a unit test in `tests/unit/` (the uncommitted `template-attributes.test.ts` addition is the model; commit it with this phase).

**Phase 2 — Router pipeline (M–L).** The architectural fix first: move match→guards→resolvers→commit entirely into `RouterService` (outlets become renderers; kills double-guards, the fragile resolver skip-flag, and the popstate guard bypass), moving the history patch into `provideRouter()` with an idempotence guard. Then the small routing fixes on the consolidated code: `:param` → `([^/]+)`, sibling backtracking, `encodeURIComponent` in path building, double-`?` query merge, `javascript:` protocol guard on routerLink (security), and consolidating the router-link element onto the directive's logic (native modifier-clicks).

**Phase 3 — Core services batch (M).** Independent small fixes, one PR per module: **state** (shared `runEffects` with `.catch`, iterate effect-map union, actionType index for multi-slice dispatch), **HTTP** (retry double-interceptor, dedup post-interceptor promise, error-interceptor rethrow, `onProgress` text handling, `AbortSignal.timeout`), **config** (deep-merge env overrides + `__proto__` guard), **DI** (`@Service` sentinel cache, `@Inject` own-property metadata), **component-base** (declared-type number/boolean coercion), **signals** (lazy read-only `computed`), plus the one-line forms export in the root barrel.

**Phase 4 — Component quick wins (M).** Small isolated diffs, mostly one file each: dialog Escape → `afterClosed` + DialogService guards; table selection reset + selection contract; avatar `_imageError` reactivity; pagination short-circuit; autocomplete request-generation counter; data-grid page clamp + resize-handle stopPropagation; `clickOutside` composedPath; positioning fixes (shift axis flags, flip+offset, autoUpdate initial run); select/autocomplete adopt autoUpdate; light-dismiss focus-steal fix; tabs/steps repeat keys; `.innerHTML` binding dev-warning; theme-name sanitization.

**Phase 5 — Accessibility sweep (L).** Systematic pass, component by component, against the WAI-ARIA patterns: combobox pattern for select/autocomplete/dropdown (ids + `aria-activedescendant` + labelledby fix); radio-group roving tabindex; tooltip (focusin/focusout, `aria-describedby`, Escape, autoUpdate); form-field ARIA re-sync in onRender; progress roles + clamped values; slotted-mode focus for tabs/steps/sidebar; focusTrap shadow fix + adoption in popover/dialog; ml-button role/submit; panel `aria-controls` associations; `announce()` queueing; icon `aria-hidden`. Land with an axe/manual-SR checklist per component.

**Phase 6 — Consistency & slot reactivity (M–L).** The `slotchange` standardization sweep (profile-card pattern → card, page-header, page-section, divider, list-item, activity-feed-item); event vocabulary + stopPropagation contract; dialog/popover lifecycle events + drawer opened/closed pairs; `title` → prefixed attributes with deprecation shim; checkbox/toggle `error` attribute; CSS token sweep to the button.styles standard; `createBrandTheme` dark mode; date-picker single-picker decision; docs for undocumented exports.

**Phase 7 — CLI overhaul (M–L).** Name/`--path` validation (traversal + selector + quote-breakout in one regex gate, mirrored by selector validation in the decorator); `util.parseArgs`; monorepo Vite alias strategy (make tsconfig and Vite agree); v2-correct interceptor template; atomic generation with prechecks; template dep pinning; delete `templates/basic/`; generated-component directory structure; starter-app repeat key; then snapshot tests of generated trees wired into the Phase 0 CI.

**Phase 8 — Structural debt (L, schedule as capacity allows).** Table/data-grid shared core extraction; popover/dropdown/select/autocomplete shared overlay-positioning helper; stable event-part listeners; constructed stylesheets; calendar-view timezone basis; `:tooltip` directive redesign; version/CHANGELOG alignment; then the "missing capabilities" list and the standard-decorators migration (major release).

**Suggested first PR batch** (all S, immediate value): CI + permissions (Phase 0) → SignalEffect `try/finally` → dialog Escape fix → avatar + pagination + table-selection + forms barrel export → CLI name validation.
