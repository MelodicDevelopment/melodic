Astra review of the Melodic framework — September 9–10, 2026

Reviewed @melodicdev/core 3.1.0 at HEAD 18b1d4a plus the existing working-tree template changes. Focus: core signals, templates, components, state, DI, HTTP, forms, routing, and benchmark validity. The component library and CLI were not exhaustively audited.

The native DOM architecture is worth keeping. Cached template structures, persistent parts, stable event wrappers, shared constructed stylesheets, and LIS-based list reconciliation are useful foundations. The main work is making scheduling and ownership reliable, then reducing the amount of JavaScript done for each update. This review does not establish a performance ranking against other frameworks.

Validation: all 44 existing core test files passed (362 tests); npm run build passed. Fourteen targeted reproduction tests failed against current behavior, documenting gaps in that passing suite. These tests were run using Vitest/happy-dom; they are correctness and reference-retention checks, not browser speed measurements or heap-growth measurements. A few tests deliberately exercise internal methods to isolate the failure. Source implementation files were not changed.

P1 = prioritize before promoting broader production use. P2 = fix in the next hardening pass.

Final verification on September 10: the existing core suite, including the newly present array-fuzz tests, passed 45 files / 365 tests using `npm run test:unit -- --reporter=dot`. Both temporary audit suites were removed from the test directory after their reproductions were embedded here. This document contains 25 findings and 24 reproduction cases (23 correctness/lifetime assertions and one proposed performance target). All local source-link targets were checked. The only repository file added by this review is `docs/ASTRA_REVIEW.md`.

1. P1 — HTTP deduplication merges requests with different response semantics.
[src/http/classes/http-client.class.ts:174](../src/http/classes/http-client.class.ts#L174); [src/http/classes/request-manager.class.ts:21](../src/http/classes/request-manager.class.ts#L21).
Two concurrent GET /me calls on one client, one with Authorization A and one with Authorization B, execute a single fetch. Both receive the first request's response. GET deduplication is enabled by default, and the key excludes headers, credentials, and mode. Account switches or tenant-specific requests in the same client can therefore receive the wrong data. Include normalized response-affecting request configuration in the identity, or require an explicit caller-supplied deduplication key. Do not log authentication material. The body identity also uses a collision-prone 32-bit hash; equality should not rely on that hash alone.

2. P1 — Reactive observers can see inconsistent derived state.
[src/signals/functions/computed.function.ts:80](../src/signals/functions/computed.function.ts#L80).
With left = computed(() => a() * 2), right = computed(() => a() * 3), and an effect reading left() + right(), changing a from 1 to 2 produces [5, 7, 10]. The intermediate 7 combines one new branch with one stale branch. Effects can trigger real side effects from that inconsistent value. Complete dependency invalidation before executing consumers, and validate producer versions when reading cached computeds.

3. P2 — Computed reads are stale inside batch().
[src/signals/functions/signal.function.ts:17](../src/signals/functions/signal.function.ts#L17); [src/signals/functions/computed.function.ts:106](../src/signals/functions/computed.function.ts#L106).
After reading double() once, batch(() => { a.set(2); double(); }) still reads 2 instead of 4. Notification deferral also defers dirty marking. Defer observer execution while keeping invalidation synchronous, or use source-version checks on reads. Document explicit read-after-write semantics.

4. P1 — The batch scheduler bypasses the circular-effect guard.
[src/signals/functions/batch.function.ts:54](../src/signals/functions/batch.function.ts#L54); [src/signals/classes/signal-effect.class.ts:38](../src/signals/classes/signal-effect.class.ts#L38).
An effect that increments its own input during a batch is queued repeatedly. Each runNow() invocation resets its local iteration count, so the 100-iteration guard never trips. A bounded reproduction reached 250; an unbounded version would keep the synchronous flush running. Enforce an execution budget across the entire flush, including recursive flushes, and restore scheduler state on failure.

5. P1 — One throwing subscriber drops unrelated batch updates.
[src/signals/functions/batch.function.ts:56](../src/signals/functions/batch.function.ts#L56); [src/signals/functions/signal.function.ts:23](../src/signals/functions/signal.function.ts#L23).
A batch sets a and b; a's subscriber throws; b's subscriber never executes. Queues are cleared before iteration, so unvisited callbacks are lost. Drain independent callbacks with per-callback error capture, then report or rethrow aggregated failures. Define the same exception isolation for ordinary signal fan-out.

6. P1 — A stale lazy route load overwrites the current screen.
[src/routing/components/router-outlet/router-outlet.component.ts:305](../src/routing/components/router-outlet/router-outlet.component.ts#L305).
Start loading slow route A, render fast route B, then resolve A: the outlet displays A. RouterService's navigation ID does not protect asynchronous work inside the outlet. Add an outlet render generation, check it after every await and before DOM writes or fallback rendering, and invalidate it on destruction. Alternatively, move loading into the protected router pipeline.

7. P1 — repeatRaw() leaves duplicate, untracked DOM behind.
[src/template/directives/builtin/repeat-raw.directive.ts:131](../src/template/directives/builtin/repeat-raw.directive.ts#L131).
Using the documented createElement factory, rendering [1] then [1, 2] produces text 112. In full reconciliation, a reused key whose factory returns a new element never removes its old element. The map then loses the old element's reference. Remove/dispose replaced elements; give this API separate create and update callbacks so its normal update path preserves identity. Its same-order path currently recreates rows with the documented factory too.

8. P2 — repeat() fails at the root of a template.
[src/template/directives/builtin/repeat.directive.ts:174](../src/template/directives/builtin/repeat.directive.ts#L174).
render(html`${repeat(...)}`, container) throws because startMarker.parentElement is null while initial commit occurs in a DocumentFragment. Use parentNode and the Node insertion contract. Include fragment-root and shadow-root cases in coverage.

9. P2 — Switching nested content to a keyed array leaves old content alive.
[src/template/classes/template-result.class.ts:935](../src/template/classes/template-result.class.ts#L935).
Replacing a nested <b>old</b> template with a keyed array containing <i>new</i> renders newold. The keyed-array entry path clears positional arrays but does not clear a previous nested template or bare node. Dispose and clear prior content whenever entering keyed-array mode without an existing keyed-array state. This remains reproducible with the current uncommitted marker-range fixes.

10. P2 — repeat() retains obsolete DOM and initial row data.
[src/template/directives/builtin/repeat.directive.ts:205](../src/template/directives/builtin/repeat.directive.ts#L205); [src/template/directives/builtin/repeat.directive.ts:213](../src/template/directives/builtin/repeat.directive.ts#L213).
After a same-key row changes template structure, its initial nodes array still points at the detached old subtree. Its unused value field retains the original data object as well. Clear the insertion snapshot after first insertion and remove unused value storage. This is retention for the lifetime of the key, not evidence that every update leaks another copy.

11. P2 — Completed HTTP requests retain abort listeners and responses.
[src/http/classes/request-manager.class.ts:97](../src/http/classes/request-manager.class.ts#L97).
registerParticipant adds an abort listener capturing pending, which holds the settled promise and its response. Completion removes the map entry but never removes that listener. A long-lived, un-aborted signal retains completed request data; repeated requests accumulate listeners. Record per-participant cleanup and run it on settlement and cancellation. raceCallerAbort already removes its own listener, but that does not remove this second listener. The fallback combineSignals path also merits matching disposal.

12. P2 — Destroying a form during validation causes late writes to destroyed signals.
[src/forms/classes/abstract-control.class.ts:238](../src/forms/classes/abstract-control.class.ts#L238); [src/forms/classes/form-control.class.ts:51](../src/forms/classes/form-control.class.ts#L51).
Start async validation, destroy the control, then resolve the validator: validation rejects with “Signal accessed after destruction.” Constructor/setValue-triggered validation uses void promises, so the same path can surface as an unhandled rejection. Invalidate the validation generation during destroy, check destroyed state after awaits and in finally, and define handling for validator rejection. An abort-aware validator contract can additionally stop unnecessary work.

13. P2 — User cleanup exceptions prevent framework cleanup.
[src/components/classes/component-base.class.ts:253](../src/components/classes/component-base.class.ts#L253).
If onDestroy throws, none of the registered disposables are destroyed and caches are not cleared, although _destroyed was already set. Move framework cleanup into finally and isolate user hooks. onDisconnect also executes before teardown is scheduled, so that hook needs the same protection.

14. P2 — Singleton factory resources inherit a component's lifetime.
[src/injection/classes/injection-engine.class.ts:138](../src/injection/classes/injection-engine.class.ts#L138).
Class construction clears the active component, but bindFactory resolution does not. A singleton factory returning a computed registers it as a disposable of the component that first requests it. Unmounting that component destroys the singleton's signal for other consumers. Apply the service ownership scope consistently to class and factory construction; an explicit injector-owned scope would also allow deterministic service disposal.

15. P2 — Current benchmarks can give misleading confidence.
[web/benchmark/main.ts:152](../web/benchmark/main.ts#L152); [tests/unit/batch-comparison.test.ts:18](../tests/unit/batch-comparison.test.ts#L18).
The add/remove benchmark appends 200 items and immediately slices back to the original first 1,000. The timed render sees the exact original keys and objects: no rows were added or removed. Change the operation and assert the resulting keys and node removals. The “React-style” comparison constructs plain objects and DOM; it does not run React. The README's relative framework rankings are not established by these tests. happy-dom timings also omit actual browser rendering costs.

Second-pass findings — completed September 10, 2026

The second pass added nine correctness/lifetime findings and one measured performance opportunity. Ten additional audit assertions reproduced the current behavior described below. The form notification assertion expresses a proposed efficiency target, not a documented existing guarantee. The first pass's fourteen cases plus these ten give 24 reproduction cases in this document.

16. P1 — First navigation into lazy children bypasses their guards.
[src/routing/components/router-outlet/router-outlet.component.ts:293](../src/routing/components/router-outlet/router-outlet.component.ts#L293); [src/routing/services/router.service.ts:364](../src/routing/services/router.service.ts#L364).
The router matches the parent and commits before loadChildren runs in the outlet. The newly loaded children are then matched and rendered by nested outlets without returning through the service-owned guard/resolver pipeline. An integration reproduction navigated to /lazy/secret with a child canActivate returning false: navigation succeeded, the guard ran zero times, and the child actually rendered. Load the necessary route configuration inside the navigation pipeline, complete the match chain, and run guards/resolvers before committing. Preserve navigation-generation checks across loading. This is a confirmed client-side navigation-guard bypass; the test makes no claim about server authorization.

17. P1 — Empty-path child guards are omitted from the matched route chain.
[src/routing/functions/match-route-level.function.ts:55](../src/routing/functions/match-route-level.function.ts#L55).
On an exact parent match, the matcher checks for an empty-child redirect, then returns without matching an empty-path child component. For parent /parent with child path '' and a rejecting guard, navigate('/parent') succeeds and the child's guard is never called. Match default child routes recursively even when no path segments remain, with cycle protection. Include their guards and resolvers in the committed match chain. This requires a matcher fix in addition to the lazy-loading fix above.

18. P2 — Replacing outlet routes installs the previous route array.
[src/routing/components/router-outlet/router-outlet.component.ts:105](../src/routing/components/router-outlet/router-outlet.component.ts#L105); [src/components/classes/component-base.class.ts:434](../src/components/classes/component-base.class.ts#L434).
ComponentBase invokes onPropertyChange before updating the backing value. The outlet hook immediately reads this.routes and calls setRoutes, so assigning newRoutes leaves the router configured with oldRoutes. The reproduction observed astra-old after assigning astra-new. Have the outlet consume the hook's new-value argument, or defer processing until assignment completes. Avoid globally changing hook timing without assessing existing consumers.

19. P2 — A destroyed queued effect restarts and resubscribes.
[src/signals/classes/signal-effect.class.ts:81](../src/signals/classes/signal-effect.class.ts#L81); [src/signals/functions/batch.function.ts:63](../src/signals/functions/batch.function.ts#L63).
An effect runs once, is queued inside batch, then destroyed before flush. It executes anyway and responds to later source writes: observed [0, 0, 1], expected [0]. destroy clears current dependencies but does not cancel pending execution or invalidate the queued entry. Cancel/invalidate scheduled work on destruction. Separate internal dependency-reset operations from terminal disposal: computed currently calls tracker.destroy() while recomputing, so simply adding a permanent destroyed flag would break computed reuse.

20. P2 — onInit-created resources escape the component's ownership scope.
[src/components/classes/component-base.class.ts:88](../src/components/classes/component-base.class.ts#L88).
The decorator restores the previous active component before calling ComponentBase's constructor, and onInit runs without installing the new component as active. A computed created in onInit remains readable after that component's teardown, rather than being disposed. During nested construction it may register with the parent instead. Wrap initialization in the component's scope with try/finally, and cover both standalone and nested construction. Also audit resources created in constructors that throw before adoption.

21. P2 — Attribute/property directive-to-value transitions skip disposal.
[src/template/classes/template-result.class.ts:1300](../src/template/classes/template-result.class.ts#L1300); [src/template/classes/template-result.class.ts:1362](../src/template/classes/template-result.class.ts#L1362).
Replacing title=${directive(...)} with title='plain' leaves the old directive state active: its __dispose callback runs zero times. The node-part branch handles directive exit, but attribute/property branches only dispose when switching to another directive type. Dispose and clear directiveState/directiveType whenever leaving a directive in these branches, including composite attribute paths. Add tests that attach an external subscription and verify it stops immediately on replacement.

22. P2 — Removing when()'s false template leaves stale content.
[src/template/directives/builtin/when.directive.ts:105](../src/template/directives/builtin/when.directive.ts#L105).
Render when(false, trueTemplate, fallback), then when(false, trueTemplate) at the same binding. The old fallback remains visible. The still-false branch does nothing when falseTemplate is absent. Remove/dispose existing false content when the fallback disappears, and release obsolete branch references. The reproduction observed 'fallback' where the container should be empty.

23. P2 — Destroyed applications remain globally reachable.
[src/bootstrap/functions/bootstrap.function.ts:83](../src/bootstrap/functions/bootstrap.function.ts#L83); [src/bootstrap/functions/bootstrap.function.ts:106](../src/bootstrap/functions/bootstrap.function.ts#L106).
bootstrap binds the app in the module-global Injector; app.destroy never releases that binding. Injector.has('IMelodicApp') remains true after destruction. The retained app includes rootElement, so a removed root and its object graph remain reachable through the singleton binding until replacement or explicit injector cleanup. Unbind only if the current binding still refers to this app, release owned references, and make destruction idempotent. Do not clear unrelated/shared injector bindings. Service destruction still requires the explicit ownership policy described in the performance roadmap.

24. P2 — Failed bootstrap leaves global error handlers installed.
[src/bootstrap/functions/bootstrap.function.ts:22](../src/bootstrap/functions/bootstrap.function.ts#L22); [src/bootstrap/functions/bootstrap.function.ts:36](../src/bootstrap/functions/bootstrap.function.ts#L36).
With onError configured, an onBefore rejection leaves both error and unhandledrejection listeners on window. No app handle is returned to clean them up. The reproduction recorded the registrations and zero matching removals. Wrap bootstrap acquisition in rollback cleanup; remove registered handlers and any root mounted before later failure. Audit provider failures, missing targets, and onReady exceptions through the same path.

25. P2 performance — Bulk form writes do quadratic aggregate work.
[src/forms/classes/form-group.class.ts:30](../src/forms/classes/form-group.class.ts#L30); [src/forms/classes/form-group.class.ts:76](../src/forms/classes/form-group.class.ts#L76); [src/forms/classes/form-array.class.ts:83](../src/forms/classes/form-array.class.ts#L83).
Updating 100 controls using one FormGroup.setValue call emitted 100 aggregate value notifications. Each child write synchronously reruns the aggregate effect, which scans all controls, allocates another aggregate object, and starts validation. A flat N-field update therefore performs O(N²) aggregate traversal; async group validators may also start N requests. Batch bulk setValue/patchValue/reset/enable/disable operations and validate the resulting consistent aggregate once, after the scheduler issues are fixed. The target of one aggregate notification is a proposed API/performance improvement; document the changed notification semantics. Reproduce for FormArray and nested groups too.

Updated implementation order for Claude:

- Resolve HTTP request identity and the signal scheduler as separate changes with regression tests.
- Complete route matching/loading before guard/resolver execution; cover lazy, default-child, stale-load, and route-reassignment cases together.
- Repair list/directive transitions and cleanups, preserving DOM identity and the user's existing marker-range changes.
- Fix component, queued-effect, HTTP, validation, and application lifetimes. Make cleanup safe when callbacks throw or initialization fails.
- Repair benchmark workloads; establish browser timing and retained-memory baselines.
- Optimize bulk forms and sparse rendering only after those baselines and correctness checks pass.

Handoff notes:

- This is a review and implementation roadmap. No framework implementation fixes were made during either pass.
- Existing uncommitted work was preserved, including marker-range fixes and array-fuzz tests. Do not overwrite it when implementing these findings.
- References identify the reviewed functions and approximate line positions at review time; locate the current symbols if code has moved.
- Treat confirmed retained references separately from measured heap growth. These tests do not quantify bytes leaked or establish a cross-framework speed ranking.
- The embedded reproduction suites use Vitest/happy-dom. Some deliberately exercise internal methods to isolate ownership and race conditions. Turn them into maintainable public-behavior regression tests while implementing fixes.
- Keep the reproductions temporary when running the review itself; both suites intentionally fail against the reviewed implementation.

Performance work, in recommended order:

- Fix the signal graph and scheduling first. Separate invalidation from execution; validate cached producer versions; deduplicate consumer runs; gate unchanged computed outputs; add explicit ownership and disposal. Angular's primary implementation notes describe graph liveness, version polling, and glitch-free propagation: [Angular signals implementation](https://github.com/angular/angular/blob/main/packages/core/primitives/signals/README.md). These are useful design references, not a recommendation to copy Angular's application architecture.
- Reduce update scope. ComponentBase subscribes to discovered public source fields and re-executes the whole template. Track the signals actually read during rendering; then offer binding-level accessors or a compiler for direct part updates. Eager html`${count()}` interpolation by itself does not preserve a binding's computation, so this needs a deliberate API/compiler design. Keep ownership attached to parts and clean dependencies when conditional branches change.
- Make sparse list updates proportional to changed rows where feasible. repeat's same-key path invokes every row template and walks every row's parts. A one-row edit in 10,000 rows still performs 10,000 template calls even when most DOM writes are skipped. Add opt-in row dependency/memoization support and virtualization. Do not blindly skip by object identity: row templates may depend on index, selection, locale, or other captured state.
- Preserve browser state during moves. Current fragment-based moves detach and reconnect custom elements, causing render/lifecycle work and potentially affecting focus or embedded state. Feature-detect state-preserving moveBefore and connectedMoveCallback where eligible; keep the current fallback for unsupported browsers and unsupported move conditions. MDN documents the behavior and constraints: [MDN moveBefore](https://developer.mozilla.org/en-US/docs/Web/API/Element/moveBefore).
- Give component, rendered-root, and application scopes explicit teardown ownership. bootstrap().destroy removes the root and error handlers but does not dispose injector services; Injector.clear only drops bindings. Define service ownership before automatically destroying shared values. Consider a public render-root disposal handle, and document whether elements detached across a microtask can be reconnected. The current implementation permanently destroys owned resources after that interval.
- Preserve existing optimizations that are already sound: template caching, direct part paths, shared stylesheets, stable listener wrappers, and LIS moves. Profile clone preparation, per-row marker/fragment allocation, and subscription churn before adding specialized fast paths. Consider optional ahead-of-time template preparation only if measured initial-render costs justify it.
- Measure production browser behavior. Compare real production builds of Melodic, a native DOM baseline, Lit, and the requested React/Vue/Angular implementations with equivalent output and semantics. Separate initial creation, sparse/full updates, append, remove, swap, reorder, mount/unmount, and lazy navigation. Track DOM identity and correctness, scripting/layout/paint time, interaction latency, allocation rate, retained heap after repeated lifecycle cycles, and actual minified/gzipped entry-point size. Use repeated samples and distributions; do not present one timing as a framework ranking.

Suggested delivery sequence: scheduler correctness and HTTP identity; DOM reconciliation and stale async work; resource lifetime fixes; benchmark repair and browser memory baselines; then fine-grained updates and list optimization. None of these requires giving up custom elements, shadow DOM, native events, or tagged templates.

The first-pass reproduction suite is embedded below so this handoff is self-contained. Copy the TypeScript block to `tests/unit/review-audit-temporary.test.ts`, run `npx vitest run tests/unit/review-audit-temporary.test.ts`, and remove that temporary copy afterward. These are intentionally failing audit cases, not changes installed in the test suite.


First-pass reproduction suite:

```ts
import { describe, it, expect, vi } from 'vitest';
import { signal, computed, batch, SignalEffect } from '../../src/signals';
import { html, render, repeat } from '../../src/template';
import { HttpClient } from '../../src/http/classes/http-client.class';
import { RequestManager } from '../../src/http/classes/request-manager.class';
import { FormControl } from '../../src/forms/classes/form-control.class';
import { RouterOutletComponent } from '../../src/routing/components/router-outlet/router-outlet.component';
import { InjectionEngine } from '../../src/injection/classes/injection-engine.class';
import { setActiveComponent } from '../../src/components/functions/active-component.functions';
import { repeatRaw } from '../../src/template/directives/builtin/repeat-raw.directive';
import { MelodicComponent } from '../../src/components/decorators/melodic-component.decorator';

describe('review reproductions: assertions describe required behavior', () => {
	it('repeatRaw removes replaced elements during list growth', () => {
		const container = document.createElement('div');
		const view = (items: number[]) => html`<div>${repeatRaw(items, x => x, x => { const el = document.createElement('b'); el.textContent = String(x); return el; })}</div>`;
		render(view([1]), container); render(view([1, 2]), container);
		expect(container.textContent).toBe('12');
	});
	it('repeat releases initial data and detached node snapshots after replacements', () => {
		const parent = document.createElement('div'); const marker = document.createTextNode(''); parent.append(marker);
		const original = { id: 1, text: 'old' };
		const state = repeat([original], x => x.id, x => html`<b>${x.text}</b>`).render(marker) as any;
		const firstNode = state.items[0].nodes[0];
		repeat([{ id: 1, text: 'new' }], x => x.id, x => html`<i>${x.text}</i>`).render(marker, state);
		expect(state.items[0].nodes.includes(firstNode)).toBe(false);
	});
	it('throwing onDestroy still disposes owned resources', () => {
		class TestComponent { onDestroy() { throw Error('user cleanup failed'); } }
		MelodicComponent({selector:'audit-destroy', template: () => html``})(TestComponent);
		const el = document.createElement('audit-destroy') as any;
		const cleanup = vi.fn(); el.registerDisposable({destroy: cleanup});
		try { el.teardown(); } catch {}
		expect(cleanup).toHaveBeenCalledTimes(1);
	});
	it('computed reads reflect writes inside a batch', () => {
		const a = signal(1);
		const double = computed(() => a() * 2);
		expect(double()).toBe(2);
		let inside = 0;
		batch(() => { a.set(2); inside = double(); });
		double.destroy();
		expect(inside).toBe(4);
	});
	it('diamond dependencies notify observers only with consistent values', () => {
		const a = signal(1);
		const left = computed(() => a() * 2);
		const right = computed(() => a() * 3);
		const values: number[] = [];
		const e = new SignalEffect(() => values.push(left() + right()));
		e.run();
		a.set(2);
		e.destroy(); left.destroy(); right.destroy();
		expect(values).toEqual([5, 10]);
	});
	it('batch scheduler applies the circular effect limit across queue passes', () => {
		const a = signal(0);
		const e = new SignalEffect(() => { const n = a(); if (n > 0 && n < 250) a.set(n + 1); });
		e.run();
		let caught: unknown;
		try { batch(() => a.set(1)); } catch (error) { caught = error; }
		e.destroy();
		expect(caught).toBeInstanceOf(Error);
	});
	it('a thrown subscriber does not suppress sibling notifications', () => {
		const a = signal(0); const b = signal(0); const seen = vi.fn();
		a.subscribe(() => { throw Error('bad subscriber'); });
		b.subscribe(seen);
		try { batch(() => { a.set(1); b.set(1); }); } catch {}
		expect(seen).toHaveBeenCalledWith(1);
	});
	it('root-level repeat works inside a document fragment', () => {
		const container = document.createElement('div');
		expect(() => render(html`${repeat([1], x => x, x => html`<span>${x}</span>`)}`, container)).not.toThrow();
	});
	it('switching a nested template to keyed values clears prior content', () => {
		const container = document.createElement('div');
		const view = (v: unknown) => html`<div>${v}</div>`;
		render(view(html`<b>old</b>`), container);
		render(view([{ __keyed: true, key: 1, value: html`<i>new</i>` }]), container);
		expect(container.textContent).toBe('new');
	});
	it('deduplication distinguishes authorization headers', async () => {
		const original = globalThis.fetch;
		const fetchMock = vi.fn(async (_url: unknown, init: RequestInit) => new Response(JSON.stringify(init.headers), {headers: {'content-type':'application/json'}}));
		globalThis.fetch = fetchMock as typeof fetch;
		try {
			const client = new HttpClient();
			await Promise.all([client.get('/me', {headers: {Authorization: 'A'}}), client.get('/me', {headers: {Authorization: 'B'}})]);
			expect(fetchMock).toHaveBeenCalledTimes(2);
		} finally { globalThis.fetch = original; }
	});
	it('settled shared requests remove participant abort listeners', async () => {
		const manager = new RequestManager(); const caller = new AbortController();
		const add = vi.spyOn(caller.signal, 'addEventListener');
		const remove = vi.spyOn(caller.signal, 'removeEventListener');
		await manager.addPendingRequest('key', Promise.resolve({data: new Uint8Array(1024), status:200, statusText:'OK', headers:new Headers(), config:{}}), new AbortController(), caller.signal);
		expect(add).toHaveBeenCalled();
		expect(remove).toHaveBeenCalledWith('abort', add.mock.calls[0][1]);
	});
	it('validation finishing after control destruction is harmless', async () => {
		const control = new FormControl('x');
		let finish!: (value: null) => void;
		(control as any)._asyncValidators = [() => new Promise(resolve => { finish = resolve; })];
		const pending = control.validate();
		control.destroy(); finish(null);
		await expect(pending).resolves.toBeUndefined();
	});
	it('slow lazy component does not overwrite a newer outlet render', async () => {
		const outlet = new RouterOutletComponent();
		outlet.elementRef = document.createElement('div');
		outlet.elementRef.attachShadow({mode:'open'});
		let finish!: () => void;
		const slow = (outlet as any).renderMatch({route:{component:'audit-slow', loadComponent: () => new Promise<void>(r => { finish = r; })}}, {});
		await (outlet as any).renderMatch({route:{component:'audit-fast'}}, {});
		finish(); await slow;
		expect(outlet.elementRef.shadowRoot!.lastElementChild!.tagName).toBe('AUDIT-FAST');
	});
	it('singleton factory resources are not owned by a consuming component', () => {
		const engine = new InjectionEngine(); const registered: unknown[] = [];
		engine.bindFactory('factory', () => computed(() => 42), {singleton:true});
		setActiveComponent({registerDisposable: (d: unknown) => registered.push(d)} as any);
		try { engine.get('factory'); } finally { setActiveComponent(null); }
		expect(registered).toHaveLength(0);
	});
});

```

Second-pass reproduction suite:

Copy this block to `tests/unit/astra-review-second-pass-temporary.test.ts` and run `npx vitest run tests/unit/astra-review-second-pass-temporary.test.ts`. The form test expresses the proposed efficiency target. Remove the temporary test file afterward.

```ts
import { describe, it, expect, vi } from 'vitest';
import { signal, computed, SignalEffect, batch } from '../../src/signals';
import { MelodicComponent } from '../../src/components/decorators/melodic-component.decorator';
import { html, render, when, directive } from '../../src/template';
import { FormControl } from '../../src/forms/classes/form-control.class';
import { FormGroup } from '../../src/forms/classes/form-group.class';
import { RouterService } from '../../src/routing/services/router.service';
import { Injector } from '../../src/injection';
import '../../src/routing/components/router-outlet/router-outlet.component';
import { bootstrap } from '../../src/bootstrap/functions/bootstrap.function';

const settle = async () => { for (let i = 0; i < 12; i++) await Promise.resolve(); };

describe('Astra second-pass review: required behavior', () => {
	it('a queued effect stays destroyed', () => {
		const source = signal(0); const seen: number[] = [];
		const effect = new SignalEffect(() => seen.push(source()));
		effect.run();
		batch(() => { effect.run(); effect.destroy(); });
		source.set(1);
		effect.destroy();
		expect(seen).toEqual([0]);
	});
	it('resources created in onInit are owned by that component', () => {
		const source = signal(1);
		class InitComponent {
			derived: any;
			onInit() { this.derived = computed(() => source() * 2); }
		}
		MelodicComponent({selector:'astra-init-scope', template: (c: InitComponent) => html`${c.derived()}`})(InitComponent);
		const el = document.createElement('astra-init-scope') as any;
		const derived = el.component.derived; derived(); el.teardown();
		let destroyed = false; try { derived(); } catch { destroyed = true; }
		derived.destroy();
		expect(destroyed).toBe(true);
	});
	it('bulk form updates avoid N aggregate notifications', () => {
		const controls = Object.fromEntries(Array.from({length: 100}, (_, i) => [String(i), new FormControl(0)]));
		const group = new FormGroup(controls);
		const observer = vi.fn(); group.value.subscribe(observer);
		group.setValue(Object.fromEntries(Array.from({length:100}, (_, i) => [String(i), 1])));
		const count = observer.mock.calls.length;
		group.destroy();
		expect(count).toBe(1);
	});
	it('empty-path child guard participates in navigation', async () => {
		const router = new RouterService(); const guard = vi.fn(() => false);
		router.setRoutes([{path:'parent', component:'astra-layout', children:[{path:'',component:'astra-child',canActivate:[{canActivate:guard}]}]}]);
		try {
			const result = await router.navigate('/parent', {scrollToTop:false});
			expect({success:result.success, calls:guard.mock.calls.length}).toEqual({success:false,calls:1});
		} finally {router.destroy();}
	});
	it('first lazy child navigation runs the child guard before rendering', async () => {
		class Layout {}
		MelodicComponent({selector:'astra-lazy-layout', template:() => html`<router-outlet></router-outlet>`})(Layout);
		const router = Injector.get(RouterService);
		const guard = vi.fn(() => false);
		const routes = [{path:'',component:'astra-home'}, {path:'lazy',component:'astra-lazy-layout',loadChildren:async () => ({routes:[{path:'secret',component:'astra-secret',canActivate:[{canActivate:guard}]}]})}];
		history.replaceState({}, '', '/');
		const outlet = document.createElement('router-outlet') as any;
		outlet.routes = routes; document.body.append(outlet); await settle();
		try {
			const result = await router.navigate('/lazy/secret', {scrollToTop:false}); await settle();
			const layout = outlet.shadowRoot.querySelector('astra-lazy-layout');
			const child = layout?.shadowRoot?.querySelector('router-outlet');
			const rendered = !!child?.shadowRoot?.querySelector('astra-secret');
			expect({success:result.success, calls:guard.mock.calls.length, rendered}).toEqual({success:false,calls:1,rendered:false});
		} finally {outlet.remove(); await settle();}
	});
	it('outlet route reassignment installs the new routes', async () => {
		const router = Injector.get(RouterService);
		const outlet = document.createElement('router-outlet') as any;
		const oldRoutes = [{path:'',component:'astra-old'}];
		const newRoutes = [{path:'',component:'astra-new'}];
		outlet.routes = oldRoutes;
		outlet.component._initialized = true;
		outlet.routes = newRoutes;
		await settle();
		expect(router.getRoutes()).toEqual(newRoutes);
	});
	it('attribute directive cleanup runs when switching to a plain value', () => {
		const cleanup = vi.fn();
		const active = directive(() => ({__dispose:cleanup}), 'astra-attribute');
		const view = (value: unknown) => html`<div title=${value}></div>`;
		const container = document.createElement('div');
		render(view(active), container); render(view('plain'), container);
		expect(cleanup).toHaveBeenCalledTimes(1);
	});
	it('removing a false branch while condition stays false clears its DOM', () => {
		const container = document.createElement('div');
		const view = (fallback?: () => any) => html`<div>${when(false, () => html`yes`, fallback)}</div>`;
		render(view(() => html`fallback`), container); render(view(), container);
		expect(container.textContent).toBe('');
	});
	it('destroyed app releases the global app binding', async () => {
		const app = await bootstrap(); app.destroy();
		expect(Injector.has('IMelodicApp')).toBe(false);
	});
	it('failed bootstrap removes installed window error handlers', async () => {
		const callback = vi.fn();
		const add = vi.spyOn(window, 'addEventListener');
		const remove = vi.spyOn(window, 'removeEventListener');
		try {
			await expect(bootstrap({onError:callback, onBefore:async () => {throw Error('startup failed');}})).rejects.toThrow('startup failed');
			const handlers = add.mock.calls.filter(([type]) => type === 'error' || type === 'unhandledrejection');
			const removed = handlers.every(([type, listener]) => remove.mock.calls.some(([t,l]) => t === type && l === listener));
			for (const [type, listener] of handlers) window.removeEventListener(type, listener);
			expect(removed).toBe(true);
		} finally {add.mockRestore(); remove.mockRestore();}
	});
});

```
