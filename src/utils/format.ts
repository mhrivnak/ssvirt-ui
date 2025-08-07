/**
 * Utility functions for formatting data display
 */

/**
 * Formats bytes into human-readable format
 * @param bytes - Number of bytes to format
 * @returns Formatted string with appropriate unit (B, KB, MB, GB, TB)
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Formats a number with thousand separators
 * @param num - Number to format
 * @returns Formatted string with commas as thousand separators
 */
export function formatNumber(num: number): string {
  return num.toLocaleString();
}

/**
 * Formats a percentage value
 * @param value - Decimal value (0-1) or percentage value (0-100)
 * @param maxDecimals - Maximum number of decimal places
 * @param asDecimal - Whether the input value is a decimal (0-1) or percentage (0-100)
 * @returns Formatted percentage string
 */
export function formatPercentage(
  value: number,
  maxDecimals: number = 1,
  asDecimal: boolean = true
): string {
  const percentage = asDecimal ? value * 100 : value;
  return `${percentage.toFixed(maxDecimals)}%`;
}
