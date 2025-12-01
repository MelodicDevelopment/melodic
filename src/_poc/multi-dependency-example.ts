/**
 * Examples demonstrating computed signals with multiple dependencies
 */

import { signal, computed } from './signal.class';

// ============================================================================
// Example 1: Multiple Signal Dependencies
// ============================================================================

const firstName = signal('John');
const lastName = signal('Doe');
const title = signal('Dr.');
const age = signal(30);

// This computed depends on FOUR signals
const fullProfile = computed(() => {
	return `${title.value} ${firstName.value} ${lastName.value}, age ${age.value}`;
});

console.log('=== Example 1: Multiple Dependencies ===');
console.log('Initial:', fullProfile.value);
// Output: "Dr. John Doe, age 30"

// Changing ANY dependency triggers recomputation
firstName.value = 'Jane';
console.log('After firstName change:', fullProfile.value);
// Output: "Dr. Jane Doe, age 30"

lastName.value = 'Smith';
console.log('After lastName change:', fullProfile.value);
// Output: "Dr. Jane Smith, age 30"

title.value = 'Prof.';
console.log('After title change:', fullProfile.value);
// Output: "Prof. Jane Smith, age 30"

age.value = 35;
console.log('After age change:', fullProfile.value);
// Output: "Prof. Jane Smith, age 35"

// ============================================================================
// Example 2: Dynamic Dependencies (Conditional Logic)
// ============================================================================

const showFullName = signal(true);
const showAge = signal(false);
const userName = signal('jsmith');

const userDisplay = computed(() => {
	let display = '';

	if (showFullName.value) {
		// When true: depends on showFullName, firstName, lastName
		display = `${firstName.value} ${lastName.value}`;
	} else {
		// When false: depends on showFullName, userName
		display = userName.value;
	}

	if (showAge.value) {
		// When true: adds age to dependencies
		display += ` (${age.value})`;
	}

	return display;
});

console.log('\n=== Example 2: Dynamic Dependencies ===');
console.log('Initial:', userDisplay.value);
// Output: "Jane Smith"
// Current dependencies: [showFullName, firstName, lastName]

showAge.value = true;
console.log('After showAge=true:', userDisplay.value);
// Output: "Jane Smith (35)"
// Current dependencies: [showFullName, firstName, lastName, showAge, age]

showFullName.value = false;
console.log('After showFullName=false:', userDisplay.value);
// Output: "jsmith (35)"
// Current dependencies: [showFullName, userName, showAge, age]
// Note: firstName and lastName are NO LONGER dependencies!

firstName.value = 'Changed';
console.log('After firstName change (should not affect):', userDisplay.value);
// Output: "jsmith (35)" - unchanged because firstName is not a dependency anymore!

userName.value = 'jdoe';
console.log('After userName change:', userDisplay.value);
// Output: "jdoe (35)" - this DOES trigger because userName is now a dependency

// ============================================================================
// Example 3: Nested Computed Signals
// ============================================================================

const price = signal(100);
const quantity = signal(2);
const taxRate = signal(0.1);

// First computed: total before tax
const subtotal = computed(() => price.value * quantity.value);
// Dependencies: [price, quantity]

// Second computed: total with tax (depends on another computed!)
const total = computed(() => {
	const sub = subtotal.value; // Accessing another computed signal
	return sub + sub * taxRate.value;
});
// Dependencies: [subtotal, taxRate]
// Indirectly depends on: [price, quantity] through subtotal

console.log('\n=== Example 3: Nested Computed ===');
console.log('Subtotal:', subtotal.value); // 200
console.log('Total:', total.value); // 220

price.value = 150;
console.log('After price change:');
console.log('Subtotal:', subtotal.value); // 300
console.log('Total:', total.value); // 330
// Changing price triggers subtotal, which triggers total!

taxRate.value = 0.2;
console.log('After tax change:');
console.log('Total:', total.value); // 360

// ============================================================================
// Example 4: Complex Business Logic with Many Dependencies
// ============================================================================

const isLoggedIn = signal(false);
const isPremium = signal(false);
const itemCount = signal(5);
const basePrice = signal(10);
const couponCode = signal<string | null>(null);

const finalPrice = computed(() => {
	if (!isLoggedIn.value) {
		// Not logged in: base price only
		// Dependencies: [isLoggedIn, basePrice, itemCount]
		return basePrice.value * itemCount.value;
	}

	let price = basePrice.value * itemCount.value;

	// Premium discount
	if (isPremium.value) {
		// Dependencies add: [isPremium]
		price *= 0.9; // 10% off
	}

	// Coupon discount
	if (couponCode.value === 'SAVE20') {
		// Dependencies add: [couponCode]
		price *= 0.8; // 20% off
	}

	return price;
});

console.log('\n=== Example 4: Complex Business Logic ===');
console.log('Initial (not logged in):', finalPrice.value); // 50

isLoggedIn.value = true;
console.log('After login:', finalPrice.value); // 50

isPremium.value = true;
console.log('After premium:', finalPrice.value); // 45 (10% off)

couponCode.value = 'SAVE20';
console.log('After coupon:', finalPrice.value); // 36 (10% + 20% off)

itemCount.value = 10;
console.log('After item count change:', finalPrice.value); // 72

// ============================================================================
// Example 5: Demonstrating Dependency Tracking with Manual Subscription
// ============================================================================

const x = signal(1);
const y = signal(2);
const z = signal(3);

const sum = computed(() => {
	console.log('  [Recomputing sum...]');
	return x.value + y.value + z.value;
});

console.log('\n=== Example 5: Tracking Recomputations ===');

// Subscribe to see when it recalculates
sum.subscribe((value) => {
	console.log(`Sum changed to: ${value}`);
});

console.log('Initial sum:', sum.value);
// Output: [Recomputing sum...] Sum changed to: 6

x.value = 10;
// Output: [Recomputing sum...] Sum changed to: 15

y.value = 20;
// Output: [Recomputing sum...] Sum changed to: 33

z.value = 30;
// Output: [Recomputing sum...] Sum changed to: 63

// ============================================================================
// Example 6: Array/Object Dependencies
// ============================================================================

const todos = signal<Array<{ id: number; text: string; done: boolean }>>([
	{ id: 1, text: 'Learn signals', done: false },
	{ id: 2, text: 'Build app', done: false },
	{ id: 3, text: 'Ship it', done: true }
]);

const completedCount = computed(() => {
	return todos.value.filter((t) => t.done).length;
});

const remainingCount = computed(() => {
	return todos.value.filter((t) => !t.done).length;
});

const progress = computed(() => {
	const total = todos.value.length;
	const completed = completedCount.value;
	return total === 0 ? 0 : Math.round((completed / total) * 100);
});

console.log('\n=== Example 6: Array/Object Dependencies ===');
console.log('Completed:', completedCount.value); // 1
console.log('Remaining:', remainingCount.value); // 2
console.log('Progress:', progress.value + '%'); // 33%

// Update the array (must create new reference for signal to detect change)
todos.value = todos.value.map((t) => (t.id === 2 ? { ...t, done: true } : t));

console.log('After completing todo #2:');
console.log('Completed:', completedCount.value); // 2
console.log('Remaining:', remainingCount.value); // 1
console.log('Progress:', progress.value + '%'); // 67%

// ============================================================================
// Summary
// ============================================================================

console.log('\n=== Summary ===');
console.log('✅ Computed signals can depend on ANY number of signals');
console.log('✅ Dependencies are automatically tracked');
console.log('✅ Dependencies can change dynamically based on conditional logic');
console.log('✅ Computed signals can depend on other computed signals');
console.log('✅ Only accessed signals become dependencies (efficient!)');
console.log('✅ Old dependencies are automatically cleaned up on each run');
