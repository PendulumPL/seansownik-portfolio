export function mapSearchResults(results = []) {
  return results
    .filter((item) => item.media_type === "movie" || item.media_type === "tv")
    .slice(0, 8)
    .map((item) => ({
      id: `tmdb-${item.media_type}-${item.id}`,
      tmdbId: item.id,
      title: item.title || item.name || "Bez tytułu",
      type: item.media_type === "movie" ? "Film" : "Serial",
      year: (item.release_date || item.first_air_date || "").slice(0, 4),
      overview: item.overview || "",
      poster: item.poster_path ? `https://image.tmdb.org/t/p/w342${item.poster_path}` : null
    }));
}
