/**
 * Card scale definitions for Scrum Poker
 */

const SCALES = {
  fibonacci: {
    name: 'Fibonacci',
    values: ['0', '1', '2', '3', '5', '8', '13', '21', '34', '55', '89', '?'],
    description: '0, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, ?',
    isNumeric: true
  },
  modified: {
    name: 'Modified Fibonacci',
    values: ['0', '½', '1', '2', '3', '5', '8', '13', '20', '40', '100', '?'],
    description: '0, ½, 1, 2, 3, 5, 8, 13, 20, 40, 100, ?',
    isNumeric: true
  },
  tshirt: {
    name: 'T-Shirt Sizes',
    values: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '?'],
    description: 'XS, S, M, L, XL, XXL, ?',
    isNumeric: false
  }
};

/**
 * Parse a card value to a number (for statistics).
 * Returns null if not numeric.
 */
function parseCardValue(value) {
  if (value === '?' || value === null || value === undefined) return null;
  if (value === '½') return 0.5;
  const num = Number(value);
  return isNaN(num) ? null : num;
}

/**
 * Get the scale object by key
 */
function getScale(key) {
  return SCALES[key] || SCALES.fibonacci;
}

/**
 * Get all available scale keys
 */
function getScaleKeys() {
  return Object.keys(SCALES);
}
