/**
 * Comparison: Property-based (.value) vs Function-based () signals
 */

// ============================================================================
// Property-Based Signals (Current Implementation)
// ============================================================================

import { Signal } from './signal.class';
import { signal as fnSignal, computed as fnComputed } from './signal-function-based.class';

console.log('=== PROPERTY-BASED SIGNALS (.value) ===\n');

// Create with 'new' or factory
const countProperty = new Signal(0);
const nameProperty = new Signal('John');

// Read using .value
console.log('Count:', countProperty.value); // 0
console.log('Name:', nameProperty.value); // 'John'

// Write using .value
countProperty.value = 5;
nameProperty.value = 'Jane';

console.log('Updated count:', countProperty.value); // 5
console.log('Updated name:', nameProperty.value); // 'Jane'

// Update method also available
countProperty.update((v) => v + 10);
console.log('After update:', countProperty.value); // 15

// ============================================================================
// Function-Based Signals (Angular/Solid.js Style)
// ============================================================================

console.log('\n=== FUNCTION-BASED SIGNALS () ===\n');

// Create with factory
const countFunction = fnSignal(0);
const nameFunction = fnSignal('John');

// Read by calling the function
console.log('Count:', countFunction()); // 0
console.log('Name:', nameFunction()); // 'John'

// Write using .set()
countFunction.set(5);
nameFunction.set('Jane');

console.log('Updated count:', countFunction()); // 5
console.log('Updated name:', nameFunction()); // 'Jane'

// Update method
countFunction.update((v) => v + 10);
console.log('After update:', countFunction()); // 15

// ============================================================================
// Template Usage Comparison
// ============================================================================

console.log('\n=== TEMPLATE USAGE COMPARISON ===\n');

// Property-based template
const propertyTemplate = `
  <!-- Property-based (requires .value) -->
  <div>Count: \${component.count.value}</div>
  <div>Name: \${component.name.value}</div>
  <div>Doubled: \${component.doubled.value}</div>
`;

// Function-based template
const functionTemplate = `
  <!-- Function-based (cleaner syntax) -->
  <div>Count: \${component.count()}</div>
  <div>Name: \${component.name()}</div>
  <div>Doubled: \${component.doubled()}</div>
`;

console.log('Property-based template syntax:');
console.log(propertyTemplate);

console.log('Function-based template syntax:');
console.log(functionTemplate);

// ============================================================================
// Computed Signals Comparison
// ============================================================================

console.log('\n=== COMPUTED SIGNALS COMPARISON ===\n');

// Property-based computed (from POC)
// Note: Need to import computed function from signal.class.ts
// const doubledProperty = computed(() => countProperty.value * 2);

// Function-based computed
const doubledFunction = fnComputed(() => countFunction() * 2);
const greetingFunction = fnComputed(() => `Hello, ${nameFunction()}!`);

console.log('Doubled:', doubledFunction()); // 30
console.log('Greeting:', greetingFunction()); // 'Hello, Jane!'

countFunction.set(20);
console.log('After count change, doubled:', doubledFunction()); // 40

// ============================================================================
// Component Example: Property-Based
// ============================================================================

class ComponentWithPropertySignals {
	count = new Signal(0);
	name = new Signal('John');

	// Computed would need special setup
	get doubled() {
		return this.count.value * 2; // Not reactive!
	}

	increment = () => {
		this.count.value++;
	};

	updateName = (newName: string) => {
		this.name.value = newName;
	};
}

// Template for property-based
// html`
//   <div>${component.count.value}</div>
//   <div>${component.name.value}</div>
//   <div>${component.doubled}</div>
//   <button @click=${component.increment}>Increment</button>
// `

// ============================================================================
// Component Example: Function-Based
// ============================================================================

class ComponentWithFunctionSignals {
	count = fnSignal(0);
	name = fnSignal('John');
	doubled = fnComputed(() => this.count() * 2); // Reactive!

	increment = () => {
		this.count.update((v) => v + 1);
	};

	updateName = (newName: string) => {
		this.name.set(newName);
	};
}

// Template for function-based
// html`
//   <div>${component.count()}</div>
//   <div>${component.name()}</div>
//   <div>${component.doubled()}</div>
//   <button @click=${component.increment}>Increment</button>
// `

// ============================================================================
// Pros and Cons
// ============================================================================

console.log('\n=== PROPERTY-BASED (.value) ===');
console.log('Pros:');
console.log('  ✅ Familiar property syntax');
console.log('  ✅ Can use assignment: count.value = 5');
console.log('  ✅ Similar to Vue refs');
console.log('\nCons:');
console.log('  ❌ Verbose in templates: count.value');
console.log('  ❌ Easy to forget .value');
console.log('  ❌ Can accidentally reassign signal: count = newSignal');

console.log('\n=== FUNCTION-BASED () ===');
console.log('Pros:');
console.log('  ✅ Cleaner templates: count()');
console.log('  ✅ Harder to accidentally mutate');
console.log('  ✅ Matches Angular Signals and Solid.js');
console.log('  ✅ Clear distinction between read count() and write count.set()');
console.log('\nCons:');
console.log('  ❌ Must use .set() or .update() (no assignment)');
console.log('  ❌ Parentheses in every read');
console.log('  ❌ Different from Vue/Svelte');

// ============================================================================
// Migration Example
// ============================================================================

console.log('\n=== MIGRATION FROM PROPERTY TO FUNCTION STYLE ===\n');

console.log('Before (property-based):');
console.log(`
  count = signal(0);

  increment() {
    this.count.value++;
  }

  template:
  html\`<div>\${component.count.value}</div>\`
`);

console.log('After (function-based):');
console.log(`
  count = signal(0);

  increment() {
    this.count.update(v => v + 1);
    // or: this.count.set(this.count() + 1);
  }

  template:
  html\`<div>\${component.count()}</div>\`
`);
