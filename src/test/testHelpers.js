import { expect, assert } from 'vitest';

/**
 * Asserts that actual equals expected.
 * @param {any} actual
 * @param {any} expected
 * @param {string} [message]
 */
export function assertEquals(actual, expected, message) {
  assert.equal(actual, expected, message);
}

/**
 * Asserts that value is truthy (or true).
 * @param {any} value
 * @param {string} [message]
 */
export function assertTrue(value, message) {
  assert.isTrue(Boolean(value), message);
}

/**
 * Asserts that value is not null and not undefined.
 * @param {any} value
 * @param {string} [message]
 */
export function assertNotNull(value, message) {
  assert.isNotNull(value, message);
  expect(value).toBeDefined();
}

/**
 * Checks and asserts if a DOM element is present and displayed in the document.
 * @param {HTMLElement|null} element
 * @returns {boolean}
 */
export function isDisplayed(element) {
  assertNotNull(element, 'Element should not be null when checking if displayed');
  expect(element).toBeInTheDocument();
  return element !== null;
}
