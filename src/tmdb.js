const TOKEN = process.env.EXPO_PUBLIC_TMDB_TOKEN || "";
const API = "https://api.themoviedb.org/3";

import { mapSearchResults } from "./tmdbMapper.mjs";

export async function searchTitles(query, options = {}) {
  if (!TOKEN || !query.trim()) return [];
  const response = await fetch(`${API}/search/multi?query=${encodeURIComponent(query)}&language=pl-PL&include_adult=false`, {
    headers: { Authorization: `Bearer ${TOKEN}`, accept: "application/json" },
    signal: options.signal
  });
  if (!response.ok) throw new Error("Nie udało się pobrać wyników TMDB");
  const json = await response.json();
  return mapSearchResults(json.results);
}

export const hasTmdbToken = Boolean(TOKEN);