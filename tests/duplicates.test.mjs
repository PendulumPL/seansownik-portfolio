import test from "node:test";
import assert from "node:assert/strict";
import { findDuplicate } from "../src/duplicates.mjs";

const items = [
  { id: "tmdb-movie-1", tmdbId: 1, title: "Diuna", type: "Film", year: "2021", status: "watched", platform: "Max" },
  { id: "manual-2", title: "Zażółć gęślą", type: "Film / serial", year: "", status: "watchlist", platform: "Netflix" }
];

test("detects the same TMDB title", () => {
  assert.equal(findDuplicate(items, { id: "tmdb-movie-1", tmdbId: 1, title: "Dune", type: "Film", year: "2021" })?.id, "tmdb-movie-1");
});

test("detects a manually entered title despite case, accents and punctuation", () => {
  assert.equal(findDuplicate(items, { id: "new", title: "  ZAZOLC-GESLA!  ", year: "" })?.id, "manual-2");
});

test("allows different productions with the same title and different years", () => {
  assert.equal(findDuplicate(items, { id: "other", title: "Diuna", type: "Film", year: "1984" }), null);
});

test("does not treat the edited record as its own duplicate", () => {
  assert.equal(findDuplicate(items, { ...items[0], title: "Diuna" }, "tmdb-movie-1"), null);
});