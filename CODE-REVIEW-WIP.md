# Code review of `todo-review` — WIP state (2026-07-06, updated after fix pass)

## FIXED this session (committed on todo-review)
- #1 repeat/keyed-array structural-change gap — new shared `renderDetachedItem()` (src/template/functions/render-detached.function.ts) used by repeat fast-path, repeat reuse-path, and updateArrayItem; also fixed updateArrayItem wiping item.nodes on same-structure updates. Regression test added (repeat.test.ts). `when` still uses its own equivalent branch — optional later cleanup to converge on the helper.
- #2 directive-type guard — REFUTED: all six builtins ARE type-tagged (finder misread); residual risk is only user-authored untyped directive pairs (documented in directive() docstring). No change.
- #3 RouterService.replace() — now delegates to navigate({replace:true}); outlets render again.
- #7 renderInto LRU churn — template lookup moved to instantiation path only.
Suites after fixes: core 289, components 509, tsc clean.

Resume point for the in-progress `/code-review high` of branch `todo-review` (all TODO-REVIEW.md remediation work, 82 commits, 318 files vs `main`). If resuming in a fresh session: skip re-running finished finder angles; go straight to **Next steps**.

## Context

- Branch `todo-review` is COMPLETE and verified: core 288 / components 509 / CLI 40 tests green, tsc clean, builds green. All 14 `review/*` branches merged. Not pushed. `main` untouched.
- Review protocol: 8 finder angles → dedup → verify (inline where possible to save tokens) → ReportFindings → apply fixes directly (no more agent waves; user is near usage limits).
- 5 of 8 angles finished and are captured below. Angles **A (line-by-line)** and **C (cross-file tracer)** were deliberately STOPPED mid-run to conserve usage (2026-07-06); **B (removed-behavior)** delivered its core findings but not its components/CLI sweep. On resume, verifying+fixing the list below is the priority; optionally re-run A/C/B-remainder as ONE combined cheap agent afterwards if budget allows (highest-value gap: cross-file check that `.set()/.update()` isn't called on computed/select results anywhere in web/demo + web/example, and stale references to renamed props/events in web/demo).

## Candidate findings so far (unverified unless noted)

### Likely-real correctness/regression candidates (verify first, fix if confirmed)

1. **`repeat` items don't handle template-structure change** — the `when` structural fix (dispose+rebuild on `__templateKey` mismatch) was NOT generalized. `repeat.directive.ts` (~line 112, 138) and `TemplateResult.updateArrayItem` (~template-result.class.ts:913) call `renderInto` on the item's detached fragment; a templateKey mismatch renders the new structure into the detached fragment while stale DOM stays visible. Scenario: `repeat(items, keyFn, item => item.editing ? html`<input>` : html`<span>`)` flips shape → dead DOM. FIX at the right altitude: hoist the "renderer identity changed → dispose and re-insert between markers" invariant into `renderInto` or a shared helper used by when/repeat/array paths.
2. **Directive-type-switch guard only covers `when`/`repeat`** — `directive.function.ts` `type` tag is optional; classMap/styleMap/unsafeHTML/repeatRaw/user directives untyped → `cond ? unsafeHTML(a) : repeatRaw(items,tpl)` still hands one directive's state to another (the original P0). FIX: default every `directive()` factory to a unique per-factory Symbol identity instead of optional string tag.
3. **`RouterService.replace()` no longer renders** (angle B, verified old-vs-new): old outlets re-rendered on NavigationEvent from patched `replaceState`; new outlet reacts only to `committedRoute`, and `replace()` never commits → URL changes, view doesn't. FIX: run the commit pipeline (or at least commit the match) in `replace()`.
4. **`select()` identity-keyed cache accumulates computeds for inline selectors** (flagged by BOTH efficiency and removed-behavior angles; docs/STATE.md:155-160 blesses the inline-arrow pattern): every render creates+registers a new live computed and disposable; dispatch cost grows with render count. Files: `signal-store.service.ts` (~65), `component-state-base.service.ts` (~55), `selector-cache-key.function.ts`. FIX options: warn+cap, or key by fn identity BUT evict/destroy the previous computed when the same call-site pattern misses (or require cacheKey in docs and update docs example).
5. **Date-picker regressions**: (a) typed input bypasses `min`/`max` (native input enforced it; `handleInput` commits any parseable date); (b) Escape while focus is inside the calendar drops focus to `<body>` (keydown bound to input only; `_restoreFocusOnClose` false on light-dismiss; no `isFocusWithin` check like dropdown has). `date-picker.component.ts` ~164-230.
6. **Attribute coercion `typeof current` heuristic traps** (`component-base.class.ts` ~178-201): union-typed props coerce by mutation history (same attribute → different result depending on prior prop value); undefined-initialized string props receive literal `"true"`/`"false"` as booleans. Candidate fix: for type-less props only coerce when attribute is `""` (presence) — or document + encourage `static propertyTypes`; at minimum fix the `label?: string` + `"false"` case by NOT boolean-coercing when prop was never boolean-typed… (decide during verify; behavioral tradeoffs).

### Efficiency candidates

7. `renderInto()` calls `getTemplate()` (now with LRU delete+set churn) on EVERY update render though result only used on first render — move inside first-render branch (`template-result.class.ts` ~194, 209). Hot path.
8. Dashboard MutationObserver: `subtree:true` + 3 full-subtree querySelectors per mutation; only direct-child slot changes matter → `subtree:false` + `:scope > [slot=…]` (`dashboard-page.component.ts` ~89).
9. form-field `onRender` re-runs full slot scan + recursive `findFormControl` walk every render → cache control element, invalidate on slotchange, only write ARIA when values differ (`form-field.component.ts` ~85).
10. `:tooltip` object-form (`{content, placement}`) defeats previousValue skip → full cleanup+microtask+setAttribute per render → early-return when parsed values unchanged (`tooltip.directive.ts` ~155).

### Reuse/simplification candidates (cheap, high-value)

11. Two independent XSS href sanitizers: core `is-safe-url.function.ts` (normalizes control chars) vs components `page-section/sanitize-href.function.ts` (single regex) → components should import core's `isSafeUrl` (already a peer dep) or move to shared functions/.
12. Tooltip component hand-rolls autoUpdate lifecycle instead of using the new `OverlayPositioner` (supports placementAttribute + arrowElement) — the ONE anchored overlay left out (`tooltip.component.ts` ~138-147).
13. `isFocusWithin()` duplicated verbatim popover ~148 / dropdown ~334 → export `isDeepFocusWithin` from `utils/accessibility/focus-trap.ts` (and date-picker should USE it — see #5b).
14. Deprecation boilerplate: title-shim warn copied 8×; quoted-prop alias accessors 18× (no warning at all); → one `warnDeprecatedOnce()` + `defineLegacyAliases(proto, map)` in `src/functions/`.
15. Slot-presence wiring copied 7+× with drift (divider filters whitespace, others don't; some do initial sync) → `watchSlotPresence()` helper.
16. Reserved-selector list duplicated CLI `validate.ts` ~12 vs core decorator — core should export the predicate.
17. Dead code: `RequestManager.hasPendingRequest()` (zero refs); router-link `isActive()` (zero refs, divergent algorithm); `runResolvers()` passthrough (collapse; only a test calls it).
18. Conventions: new error-message CSS in checkbox(~119)/toggle(~167)/button-group(~28) styles reference global spacing tokens directly (violates CLAUDE.md component-token rule the branch itself enforced elsewhere).

## Next steps (resume here) — remaining after fix pass
Still open, in priority order: #4 select() inline-selector cache accumulation (CONFIRMED by two angles + docs pattern; needs design: evict-and-replace vs warn+cap vs docs change); #5 date-picker min/max bypass + Escape-in-calendar focus drop; #6 coercion typeof-current union traps (decide policy); #8-10 efficiency (dashboard observer, form-field render scan, :tooltip object-form); #11-18 reuse/cleanup batch. Original plan below.

## Original next steps

1. If angle A/B-final/C results arrived before session end, merge their candidates into the list (dedup: tooltip-positioner and title-shim appear in multiple angles already).
2. Verify inline (Read the cited lines; no verifier agents needed except genuinely ambiguous cross-file ones). Items 1-3 verify by reading repeat.directive.ts/template-result/router.service; item 4 verify by writing a tiny test or reading component _selectCache wiring.
3. Call ReportFindings (level "high") with survivors, ranked: 1,2,3,4,5,6 correctness first.
4. Apply fixes directly (user approved fixing; no agent waves — do inline). Re-run: root `npm test` + tsc, components `npm test`, CLI `npm test`. Commit on `todo-review`.
5. Delete this file once done; update memory entry `melodic-todo-review-status`.

## Outstanding user-facing items (unchanged)

- User must: review/merge `todo-review`, push (first real CI run), confirm 3.0.0 release shape, browser/VoiceOver pass on demo.
- Publish-time: bump components peer-dep + CLI template pins `^2.0.0` → `^3.0.0` after core 3.0.0 publishes (noted in CHANGELOG).
