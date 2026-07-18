const VALID_STATUSES = new Set(["watched", "watching", "watchlist"]);
const MAX_BACKUP_SIZE = 5 * 1024 * 1024;

const optionalString = (value, maxLength) => {
  if (value == null) return value;
  if (typeof value !== "string") throw new Error("Nieprawidłowe pole tekstowe w kopii.");
  return value.slice(0, maxLength);
};

const optionalTimestamp = (value) => {
  if (value == null) return value;
  if (!Number.isFinite(value) || value < 0) throw new Error("Nieprawidłowa data w kopii.");
  return value;
};

export function parseBackupText(text) {
  if (typeof text !== "string" || text.length === 0) throw new Error("Plik kopii jest pusty.");
  if (text.length > MAX_BACKUP_SIZE) throw new Error("Plik kopii jest zbyt duży.");

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("Wybrany plik nie jest prawidłową kopią Seansownika.");
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed) || parsed.version !== 1 || !Array.isArray(parsed.items)) {
    throw new Error("Nieobsługiwany format kopii Seansownika.");
  }

  const ids = new Set();
  const items = parsed.items.map((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) throw new Error("Kopia zawiera uszkodzony wpis.");
    if ((typeof item.id !== "string" && typeof item.id !== "number") || String(item.id).length === 0) throw new Error("Wpis w kopii nie ma identyfikatora.");
    if (ids.has(String(item.id))) throw new Error("Kopia zawiera powtórzony identyfikator.");
    ids.add(String(item.id));
    if (typeof item.title !== "string" || item.title.trim().length === 0) throw new Error("Wpis w kopii nie ma tytułu.");
    if (!VALID_STATUSES.has(item.status)) throw new Error("Wpis w kopii ma nieprawidłową kategorię.");
    if (typeof item.platform !== "string" || item.platform.trim().length === 0) throw new Error("Wpis w kopii nie ma platformy.");
    if (item.rating != null && (!Number.isFinite(item.rating) || item.rating < 0 || item.rating > 10)) throw new Error("Wpis w kopii ma nieprawidłową ocenę.");

    return {
      ...item,
      title: item.title.trim().slice(0, 200),
      platform: item.platform.trim().slice(0, 100),
      type: optionalString(item.type, 100),
      year: optionalString(item.year, 20),
      info: optionalString(item.info, 200),
      poster: optionalString(item.poster, 1000),
      note: optionalString(item.note, 5000),
      createdAt: optionalTimestamp(item.createdAt),
      updatedAt: optionalTimestamp(item.updatedAt),
      watchedAt: optionalTimestamp(item.watchedAt)
    };
  });

  return { items, exportedAt: parsed.exportedAt || null };
}