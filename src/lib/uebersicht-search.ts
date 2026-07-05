// Pure string helpers for the Übersicht — no JSON import, so the client filter
// component can pull these in without dragging aws-services-172.json into the
// browser bundle. Server, client and tests all share this one implementation.

// Sort/index key: drop a leading Amazon/AWS prefix, lowercase — a learner looks
// up "Athena", not "Amazon Athena". Display always keeps the full name.
export function sortKey(name: string): string {
  return name.replace(/^(Amazon|AWS)\s+/i, "").toLowerCase();
}

/**
 * Prefix search against a service's sort key (name without Amazon/AWS prefix),
 * case-insensitive. Empty query matches everything. "g" and "glue" both match
 * Glue; "a" matches every A-service — consistent with the alphabetical order.
 */
export function matchesQuery(sortKeyName: string, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return sortKeyName.startsWith(q);
}
