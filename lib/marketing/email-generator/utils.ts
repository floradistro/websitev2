/**
 * Email Generator Utilities
 */

/**
 * Strip HTML tags for plain text version
 */
export function stripHTML(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
