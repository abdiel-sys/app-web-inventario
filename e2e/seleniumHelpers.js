import assert from 'assert';

/**
 * Asserts strict equality between actual and expected.
 * @param {any} actual
 * @param {any} expected
 * @param {string} [message]
 */
export function assertEquals(actual, expected, message) {
  assert.strictEqual(actual, expected, message || `Expected ${actual} to equal ${expected}`);
}

/**
 * Asserts that value is truthy (true).
 * @param {any} value
 * @param {string} [message]
 */
export function assertTrue(value, message) {
  assert.strictEqual(Boolean(value), true, message || `Expected ${value} to be true`);
}

/**
 * Asserts that value is not null and not undefined.
 * @param {any} value
 * @param {string} [message]
 */
export function assertNotNull(value, message) {
  assert.notStrictEqual(value, null, message || 'Expected value not to be null');
  assert.notStrictEqual(value, undefined, message || 'Expected value not to be undefined');
}

/**
 * Asynchronously checks and asserts if a Selenium WebElement is displayed.
 * @param {import('selenium-webdriver').WebElement} element
 * @param {string} [message]
 * @returns {Promise<boolean>}
 */
export async function isDisplayed(element, message) {
  assertNotNull(element, message || 'Element should not be null');
  const displayed = await element.isDisplayed();
  assertTrue(displayed, message || 'Element should be visible on the page');
  return displayed;
}
