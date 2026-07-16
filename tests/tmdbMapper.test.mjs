import test from "node:test";
import assert from "node:assert/strict";
import { mapSearchResults } from "../src/tmdbMapper.mjs";

test("mapuje filmy i seriale oraz pomija inne typy", () => {
  const result = mapSearchResults([
    { id: 1, media_type: "movie", title: "Film", release_date: "2025-01-02", poster_path: "/film.jpg" },
    { id: 2, media_type: "person", name: "Osoba" },
    { id: 3, media_type: "tv", name: "Serial", first_air_date: "2024-02-03", poster_path: null }
  ]);

  assert.equal(result.length, 2);
  assert.deepEqual(result.map((item) => item.type), ["Film", "Serial"]);
  assert.equal(result[0].year, "2025");
  assert.equal(result[1].poster, null);
});

test("ogranicza wynik do ośmiu pozycji", () => {
  const source = Array.from({ length: 12 }, (_, index) => ({
    id: index,
    media_type: "movie",
    title: `Film ${index}`
  }));
  assert.equal(mapSearchResults(source).length, 8);
});
