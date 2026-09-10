# Testing

`@melodicdev/core/testing` provides the pieces every Melodic component test needs, so tests
stop hand-rolling them. It is framework-agnostic — it works with Vitest, Jest, or anything
that gives you a DOM.

```typescript
import { mount, flush, query, text, unmountAll } from '@melodicdev/core/testing';
```

## Why these helpers exist

Two things about Melodic are easy to get wrong by hand:

- **Renders are scheduled on a microtask.** Reading the DOM immediately after a property
  write sees the previous render.
- **Teardown is deferred.** `disconnectedCallback` queues destruction on a microtask, which
  a reconnect within that window cancels. A test that removes an element and immediately
  asserts on cleanup asserts too early.

`flush()` covers both by yielding a macrotask turn.

## `mount(selector, properties?, options?)`

Creates the element, assigns `properties` **before** connecting it (exactly as a parent
template's `.prop=` bindings would), appends it, and waits for the first render.

```typescript
const el = await mount<MyCounter>('my-counter', { count: 3 });

expect(text(el)).toBe('3');
expect(el.component.count).toBe(3); // the user's component instance
```

Options:

| Option | Meaning |
|---|---|
| `container` | Mount into this element instead of a fresh `<div>` on `document.body` |
| `attributes` | Attributes to set before connecting |

The returned element carries `component` (the user's instance) and `unmount()`.

Mounting an unregistered selector throws with a message that says to import the component
module — a much better failure than a silently inert `HTMLUnknownElement`.

## `flush()`

Lets pending renders and deferred teardown run.

```typescript
query<HTMLButtonElement>(el, 'button')!.click();
await flush();
expect(text(el)).toContain('4');
```

## `query` / `queryAll` / `text`

Shadow-root-aware helpers.

```typescript
query<HTMLInputElement>(el, 'input');
queryAll(el, 'li');
text(el); // whitespace-collapsed textContent of the shadow root
```

## `captureEvents(target, name)`

Collects events until the returned function is called, which stops listening and returns
what was captured.

```typescript
const captured = captureEvents<{ value: string }>(el, 'ml:change');

query<HTMLInputElement>(el, 'input')!.dispatchEvent(new Event('input'));
await flush();

const events = captured();
expect(events).toHaveLength(1);
expect(events[0].detail.value).toBe('hello');
```

## `unmountAll()`

Removes everything `mount()` created. Put it in an `afterEach`:

```typescript
afterEach(unmountAll);
```

## Replacing a dependency

`@Service` fields are writable, so a fake goes in without a container:

```typescript
const el = await mount<UserBadge>('user-badge');
el.component.auth = { user: signal({ name: 'Ada' }) } as AuthService;
el.requestRender();
await flush();
```

For an injector-wide swap, bind before the component is constructed:

```typescript
Injector.bindValue(HttpClient, fakeHttp);
```

## Controlling dev mode

Dev warnings are on under a bundler's dev build (which is what a test run usually is). To
assert on one, or to silence it:

```typescript
import { setDevMode, resetDevWarnings } from '@melodicdev/core/devtools';

setDevMode(true);   // force on
setDevMode(false);  // force off
setDevMode(null);   // back to detection

resetDevWarnings(); // clear the once-per-key memory between tests
```

## Testing signals and effects

Signal writes are synchronous, so no flush is needed:

```typescript
const count = signal(0);
const seen: number[] = [];

const ref = effect(() => seen.push(count()));

count.set(1);
expect(seen).toEqual([0, 1]);

ref.destroy();
```

## Testing routing

`RouterService` can be constructed directly — no bootstrap, no outlet:

```typescript
const router = new RouterService();
router.setRoutes([{ path: 'users/:id', component: 'x-user' }]);

await router.navigate('/users/7');
expect(router.getParam('id')).toBe('7');

router.destroy(); // removes its window listeners
```

Assert on the event stream for redirects, blocks and failures:

```typescript
const events: INavigationEvent[] = [];
router.events.subscribe((event) => event && events.push(event));
```
