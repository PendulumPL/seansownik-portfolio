const normalizeTitle = (value = "") => value
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLocaleLowerCase("pl")
  .replace(/ł/g, "l")
  .replace(/[^a-z0-9]+/g, " ")
  .trim();

export function findDuplicate(items, candidate, excludeId = null) {
  if (!candidate) return null;
  const candidateId = candidate.id == null ? null : String(candidate.id);
  const candidateTmdbId = candidate.tmdbId == null ? null : String(candidate.tmdbId);
  const candidateTitle = normalizeTitle(candidate.title);
  const candidateYear = String(candidate.year || "").trim();

  return items.find((item) => {
    if (excludeId != null && String(item.id) === String(excludeId)) return false;
    if (candidateId && String(item.id) === candidateId) return true;
    if (candidateTmdbId && item.tmdbId != null && String(item.tmdbId) === candidateTmdbId && item.type === candidate.type) return true;
    if (!candidateTitle || normalizeTitle(item.title) !== candidateTitle) return false;
    const itemYear = String(item.year || "").trim();
    return !candidateYear || !itemYear || candidateYear === itemYear;
  }) || null;
}