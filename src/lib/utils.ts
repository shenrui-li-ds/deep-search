/**
 * Returns the current date in a formatted string
 * Format: Month DD, YYYY (e.g., January 30, 2025)
 */
export function getCurrentDate(): string {
  const date = new Date();
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Extracts the domain from a URL
 * @param url URL string
 * @returns domain without www. prefix
 */
export function getDomain(url: string): string {
  try {
    const domain = new URL(url).hostname;
    return domain.replace(/^www\./, '');
  } catch {
    return url;
  }
}
