// Tag serialization helpers.
// Backend stores tags as a single CSV string ("work,urgent") or null.
// The UI prefers an array of trimmed, deduplicated, lowercase tags.

/**
 * Parse a comma-separated tag string into a deduplicated array of trimmed tags.
 * Returns [] for null / empty / whitespace-only input.
 */
export function parseTags(csv: string | null | undefined): string[] {
  if (!csv) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of csv.split(',')) {
    const tag = raw.trim();
    if (!tag) continue;
    const key = tag.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(tag);
  }
  return out;
}

/**
 * Serialize an array of tags back to the backend CSV format.
 * Returns null when there are no tags so the backend can store NULL.
 */
export function serializeTags(tags: string[] | null | undefined): string | null {
  if (!tags || tags.length === 0) return null;
  const cleaned = parseTags(tags.join(','));
  return cleaned.length === 0 ? null : cleaned.join(',');
}

/**
 * Collect every distinct tag across a list of tasks. Useful for autocomplete.
 */
export function collectAllTags(tasks: Array<{ tags: string | null }>): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const t of tasks) {
    for (const tag of parseTags(t.tags)) {
      const key = tag.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(tag);
    }
  }
  return out.sort((a, b) => a.localeCompare(b));
}
