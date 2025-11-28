# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Melodic** is a lightweight web component framework featuring:
- Custom element system using TypeScript decorators
- Ultra-fast template system with tagged template literals
- Plugin-friendly directive system for DOM manipulation
- Shadow DOM encapsulation
- Reactive property observation

## Build Commands

```bash
npm run dev      # Start Vite dev server
npm run build    # Compile TypeScript and build for production
npm run preview  # Preview production build
```

## Architecture

### Component System

Components are created using the `@MelodicComponent` decorator and extend `HTMLElement` via `ComponentBase`:

**Key flow:**
1. `@MelodicComponent` decorator receives metadata (selector, template, styles)
2. Creates a custom element class extending `ComponentBase`
3. `ComponentBase` constructor:
   - Instantiates user component class via `Reflect.construct`
   - Attaches Shadow DOM
   - Calls `#observe()` to make properties reactive
   - Fires `onInit()` lifecycle hook
4. `#observe()` wraps data properties with getters/setters that trigger re-renders
   - **Important:** Skips existing getters and functions to preserve their behavior
5. When properties change, `#render()` is called automatically
6. Templates can be functions returning `TemplateResult` (from `html`` tagged template)

**Component file structure pattern:**
- `component-name.component.ts` - Component class with state and methods
- `component-name.template.ts` - HTML template function
- `component-name.styles.ts` - CSS styles function

### Template System (`src/template/template.ts`)

**Parse-once, update-forever strategy:**

1. **Parse phase** (`#getTemplate()`):
   - Template strings are hashed and cached
   - HTML is built with special markers for dynamic positions
   - Detects event bindings (`@click`), property bindings (`.value`), attributes
   - Parts metadata stored (type: node/attribute/property/event)

2. **First render** (`renderInto()`):
   - Clone cached template
   - Walk DOM recursively (not TreeWalker - it misses nodes)
   - Replace comment markers with text nodes
   - Match `__event-X__`, `__prop-X__` attributes
   - Store Parts array on container

3. **Updates** (`#commit()`):
   - Only update changed values (skip if `previousValue === value`)
   - Directives manage their own state via `DirectiveResult.render()`
   - Direct node manipulation (no virtual DOM)

**Critical detail:** Regex for attribute detection is `/([@.:]?[\w-]+)\s*=\s*["']?$/` to capture `@`, `.`, `:` prefixes.

### Directive System

Directives are reusable DOM manipulation primitives. Two creation patterns:

1. **Function-based** (simple): `directive((container, previousState) => { ... })`
2. **Class-based** (complex): Extend `Directive` class

**Built-in directives:**
- `repeat()` - Keyed list rendering with DOM reuse (stores RepeatState with keyToIndex map)
- `when()` - Conditional rendering (completely removes from DOM when false)
- `classMap()` - Dynamic CSS classes
- `styleMap()` - Dynamic inline styles (converts camelCase to kebab-case)
- `unsafeHTML()` - Raw HTML rendering (security warning in docs)

**Key concept:** Directives receive `previousState` from their last render. Return new state to cache it.

### Property Reactivity

`ComponentBase.#observe()` makes properties reactive:
- Only observes data properties (skips getters/setters and functions)
- Wraps each property with getter/setter
- Setter checks `if (_val !== newVal)` before triggering re-render
- Fires `onPropertyChange()` lifecycle hook

**Bug to watch:** Original implementation didn't check for existing getters, which broke computed properties like `get safeHTMLContent()`. Now fixed with descriptor check.

### TypeScript Configuration

- `experimentalDecorators: true` - Required for `@MelodicComponent`
- `emitDecoratorMetadata: true` - Enables decorator metadata
- `useDefineForClassFields: false` - Ensures decorator field behavior
- `verbatimModuleSyntax: true` - Requires `import type` for type-only imports
- Uses Vite with Rolldown bundler

### Import Patterns

Public API exports from `src/index.ts`:

```typescript
// Component system
import { MelodicComponent } from 'melodic';
import type { IComponent, IComponentMeta } from 'melodic';

// Template system
import { html, render } from 'melodic';
import type { TemplateResult } from 'melodic';

// Directive system
import { directive, Directive } from 'melodic';
import { repeat, when, classMap, styleMap, unsafeHTML } from 'melodic';
```

**Note:** Use `import type` for interfaces due to `verbatimModuleSyntax`.

## Component Lifecycle Hooks

All hooks are optional (defined in `IComponent` interface):

- `onInit()` - Called before DOM attachment, after property observation setup
- `onCreate()` - Called after `connectedCallback()` (element added to DOM)
- `onRender()` - Called after each render
- `onDestroy()` - Called on `disconnectedCallback()` (element removed)
- `onAttributeChange(name, oldVal, newVal)` - Called when observed attributes change
- `onPropertyChange(name, oldVal, newVal)` - Called before property changes

## Documentation Files

- `DIRECTIVE_GUIDE.md` - Comprehensive guide for creating custom directives (8+ examples)
- `DIRECTIVES_QUICK_REFERENCE.md` - Quick reference for built-in directives
- `TEMPLATE_EXAMPLES.md` - Template system usage examples

## Known Issues / Things to Watch

1. **Getters must be preserved:** `#observe()` should skip properties with existing getters
2. **TreeWalker doesn't work:** Use recursive walk for finding all DOM nodes
3. **Directive state caching:** Always return state from directive render functions
4. **Event listener cleanup:** Events are re-bound on every render (consider optimization)
5. **No tests yet:** Framework is in active development
