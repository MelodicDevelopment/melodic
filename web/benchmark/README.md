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

### Console Output

After running all benchmarks, check the browser console for a formatted summary:

```
╔═══════════════════════════════════════════════════════════╗
║       Melodic Performance Benchmark Results (v0.1)        ║
╠═══════════════════════════════════════════════════════════╣
║ Bundle Size: 2.87 kB gzipped (61% smaller than v0.0)     ║
║ Status: Smallest full-featured web component framework    ║
╠═══════════════════════════════════════════════════════════╣
║ Initial Render (1000 items):  35.24  ms                  ║
║ Full Update (1000 items):     22.18  ms                  ║
║ Partial Update (10/1000):     6.42   ms                  ║
║ Reordering (1000 items):      15.89  ms                  ║
║ Add/Remove (200 items):       19.33  ms                  ║
╚═══════════════════════════════════════════════════════════╝
```

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

Published bundle sizes (minified + gzipped, entry point only) are the one
comparison that is stable enough to list:

| Framework | Bundle Size |
|-----------|-------------|
| **Melodic core** | see `npm run benchmark:update` |
| Preact | ~4 kB |
| Lit | ~6-7 kB |
| Solid | ~7 kB |
| Vue 3 | ~34 kB |
| React + ReactDOM | ~40 kB |

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

For accurate production performance:

1. Build the library:
   ```bash
   npm run build
   ```

2. Test the built bundle in `dist/melodic.js`

3. Production builds are ~20-30% faster due to optimizations

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
4. Add performance targets to `PERFORMANCE.md`

## See Also

- `../PERFORMANCE.md` - Full performance documentation
- `../BUNDLE-SIZE-OPTIMIZATION.md` - Bundle size optimization guide
- `../OPTIMIZATION-SUMMARY.md` - Summary of optimizations applied

---

*Benchmarks last updated: v0.1 (2.87 kB gzipped)*
