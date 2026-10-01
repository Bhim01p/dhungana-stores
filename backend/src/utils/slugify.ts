/**
 * Converts a string into a URL-safe slug.
 * Example: "Chini (Sugar)" → "chini-sugar"
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')   // remove non-word chars except spaces and hyphens
    .replace(/[\s_]+/g, '-')    // spaces and underscores → hyphens
    .replace(/--+/g, '-')       // collapse multiple hyphens
    .replace(/^-+|-+$/g, '');   // trim leading/trailing hyphens
}
