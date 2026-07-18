export const watchedTimestamp = (item) => item.watchedAt || item.updatedAt || item.createdAt || 0;

export function buildWatchedNumbers(items, platform = "Wszystkie") {
  const watched = items
    .map((item, sourceIndex) => ({ item, sourceIndex }))
    .filter(({ item }) => item.status === "watched" && (platform === "Wszystkie" || item.platform === platform))
    .sort((a, b) => watchedTimestamp(a.item) - watchedTimestamp(b.item) || b.sourceIndex - a.sourceIndex);

  return new Map(watched.map(({ item }, index) => [item.id, index + 1]));
}
