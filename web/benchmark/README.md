# Melodic Performance Benchmarks

Interactive performance testing suite for the Melodic framework.

## Quick Start

```bash
npm run benchmark
```

This will start the dev server and automatically open the benchmark page in your browser.

## What Gets Tested

### 1. Initial Render (1,000 items)
- **Measures:** Time to render a large list from scratch
- **Target:** <40ms (excellent), <80ms (good)
- **Tests:** Template parsing, caching, DOM creation

### 2. Full Update (1,000 items)
- **Measures:** Time to update all items in a list
- **Target:** <25ms (excellent), <50ms (good)
- **Tests:** Keyed list reconciliation, DOM updates

### 3. Partial Update (10 of 1,000 items)
- **Measures:** Time to update only changed items
- **Target:** <8ms (excellent), <15ms (good)
- **Tests:** Skip-unchanged optimization

### 4. List Reordering (1,000 items)
- **Measures:** Time to reverse/shuffle a list
- **Target:** <18ms (excellent), <35ms (good)
- **Tests:** DOM reordering without re-creation

### 5. Add/Remove (200 items)
- **Measures:** Time to add and remove items
- **Target:** <22ms (excellent), <45ms (good)
- **Tests:** Node reuse, efficient reconciliation

## Understanding Results

### Color Coding
- 🟢 **Green (Pass):** Performance meets excellent target
- 🟡 **Yellow (Warn):** Performance meets good target
- 🔴 **Red:** Performance below target (needs investigation)

### Recording results

Timings are shown on the page only. Nothing is written to disk and no timing
baseline is tracked in this repository, so a regression is caught by running the
suite before and after a change and comparing by eye. The one tracked number is
the bundle size — see [Bundle size](#bundle-size).

## Running Tests

### Run All Tests
Click the **"Run All Benchmarks"** button to execute all tests sequentially.

### Run Individual Tests
Click individual test buttons to run specific benchmarks.

### Clear Results
Click **"Clear Results"** to reset all test results.

## Comparing with Other Frameworks

This suite measures Melodic against **its own targets** in a single browser. It
does not run React, Vue, Lit or Solid, so it cannot rank Melodic against them —
and no such ranking is claimed here. The `framework-comparison.js` page loads the
other frameworks from a CDN for a side-by-side run; treat those numbers as a
rough sanity check, not a benchmark result: they mix dev and production builds,
run one sample per test, and measure scripting time only (no layout/paint,
no interaction latency, no retained heap).

Bundle sizes are deliberately not tabulated against other frameworks here. A
size comparison is only fair between equivalent things, and the usual quoted
figures are not: Preact's ~4 kB and Lit's ~6 kB are rendering cores, while
Melodic's bundle below also contains a router, forms, an HTTP client, DI and a
store. See [Bundle size](#bundle-size) for what Melodic actually ships.

A fair cross-framework comparison needs equivalent production builds, the same
DOM output, repeated samples reported as distributions, and separate numbers for
creation, sparse/full updates, append, remove, swap, reorder and mount/unmount.
That harness does not exist in this repository yet.

## Performance Tips

### For Best Results:
1. Close other browser tabs to reduce noise
2. Use Chrome DevTools Performance tab for deeper analysis
3. Run tests multiple times and average results
4. Test in production build mode (this benchmark uses dev mode)

### Factors That Affect Performance:
- Browser engine (Chrome/Firefox/Safari)
- CPU speed and available cores
- Background processes
- Browser extensions
- Memory pressure

## Advanced Testing

### Custom Tests

You can modify `web/benchmark/main.ts` to add custom benchmarks:

```javascript
window.customBenchmark = async function() {
    const start = performance.now();

    // Your test code here

    const end = performance.now();
    console.log(`Custom test: ${(end - start).toFixed(2)}ms`);
};
```

### Production Build Testing

`npm run benchmark` serves the framework source through the Vite dev server,
with dev diagnostics on. For production numbers, build the bundle
(`npm run build:bundle`) and point the page at `bundle/melodic-core.min.js`.

## Bundle size

```bash
npm run benchmark:update   # rebuilds bundle/, measures it, updates the page
npm run size               # pass/fail check that the .min.js files really are minified
```

`benchmark:update` measures `bundle/melodic-core.min.js` — the **complete**
core framework (templates, signals, components, routing, forms, HTTP, DI,
state) as one minified file — and writes the result to `index.html` and to the
tracked `bundle-size.json`, so a size change shows up in review as a diff.

Measured on 2026-11-16 (working tree after 4.0.1):

| | Raw | Gzip | Brotli |
|---|---|---|---|
| `melodic-core.min.js` (everything) | 127.9 kB | 38.1 kB | 33.3 kB |
| `@melodicdev/core/signals` only, bundled + minified | — | 2.7 kB | — |
| `@melodicdev/core/template` only, bundled + minified | — | 9.1 kB | — |

The last two rows are what a bundler user pays for importing just that entry
point; they were measured with `esbuild --bundle --minify` on the 4.0.1 `lib/`
output.

Earlier versions of this file claimed "2.87 kB gzipped — smallest full-featured
web component framework". That figure dated from v0.1, was never re-measured,
and was later "updated" by a script that measured the 2 kB re-export barrel
(`lib/index.js`) instead of the framework. It was wrong by more than a factor
of ten and has been removed.

## Interpreting Results

### Good Performance Profile
- Initial render: 30-40ms
- Updates: 20-30ms
- Partial updates: 5-10ms
- All metrics in green

### Red Flags
- Initial render >100ms: Template caching may not be working
- Updates >60ms: List reconciliation issue
- Partial updates >20ms: Optimization bypassed
- Erratic results: Browser throttling or background activity

## Troubleshooting

### High Times Across All Tests
- Close background apps
- Disable browser extensions
- Check CPU isn't throttled
- Try a different browser

### Specific Test Slow
- Check browser console for errors
- Verify directive implementations
- Look for exceptions in DevTools

### Inconsistent Results
- Run multiple times
- Average the results
- Check for background processes

## Contributing

To add new benchmarks:

1. Add a new benchmark card in `web/benchmark/index.html`
2. Implement the test in `web/benchmark/main.ts`
3. Update this README with the new test details
4. Add its target to the "What Gets Tested" section above
