/**
 * Formats a value in megabytes to a human-readable string
 * @param megabytes - The value in megabytes
 * @returns Formatted string (e.g., "2.0 GB" or "512 MB")
 */
export const formatMegabytes = (megabytes: number): string => {
  if (megabytes >= 1024) {
    return `${(megabytes / 1024).toFixed(1)} GB`;
  }
  return `${megabytes} MB`;
};