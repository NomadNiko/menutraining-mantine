// src/utils/price-formatter.ts
/**
 * Formats a price value for display
 * @param price The price value to format
 * @param currency The currency symbol to use (default: $)
 * @returns Formatted price string
 */
export function formatPriceDisplay(
  price: number,
  currency: string = "$"
): string {
  return `${currency}${price.toFixed(2)}`;
}
