import test from "node:test";
import assert from "node:assert/strict";
import { buildWatchedNumbers, watchedTimestamp } from "../src/watchedOrder.mjs";

test("najstarszy obejrzany tytuł dostaje numer 1", () => {
  const numbers = buildWatchedNumbers([
    { id: "newest", status: "watched", watchedAt: 300 },
    { id: "watchlist", status: "watchlist", createdAt: 50 },
    { id: "oldest", status: "watched", watchedAt: 100 },
    { id: "middle", status: "watched", watchedAt: 200 }
  ]);

  assert.equal(numbers.get("oldest"), 1);
  assert.equal(numbers.get("middle"), 2);
  assert.equal(numbers.get("newest"), 3);
  assert.equal(numbers.has("watchlist"), false);
});

test("stare dane używają updatedAt lub createdAt", () => {
  assert.equal(watchedTimestamp({ watchedAt: 30, updatedAt: 20, createdAt: 10 }), 30);
  assert.equal(watchedTimestamp({ updatedAt: 20, createdAt: 10 }), 20);
  assert.equal(watchedTimestamp({ createdAt: 10 }), 10);
});

test("przy braku dat najstarszy wpis z dołu listy dostaje numer 1", () => {
  const numbers = buildWatchedNumbers([
    { id: "newer", status: "watched" },
    { id: "older", status: "watched" }
  ]);

  assert.equal(numbers.get("older"), 1);
  assert.equal(numbers.get("newer"), 2);
});

test("each platform has its own numbering", () => {
  const items = [
    { id: "netflix-new", status: "watched", platform: "Netflix", watchedAt: 400 },
    { id: "max-new", status: "watched", platform: "Max", watchedAt: 300 },
    { id: "netflix-old", status: "watched", platform: "Netflix", watchedAt: 200 },
    { id: "max-old", status: "watched", platform: "Max", watchedAt: 100 }
  ];

  const all = buildWatchedNumbers(items, "Wszystkie");
  assert.equal(all.get("max-old"), 1);
  assert.equal(all.get("netflix-old"), 2);
  assert.equal(all.get("max-new"), 3);
  assert.equal(all.get("netflix-new"), 4);

  const netflix = buildWatchedNumbers(items, "Netflix");
  assert.equal(netflix.get("netflix-old"), 1);
  assert.equal(netflix.get("netflix-new"), 2);
  assert.equal(netflix.has("max-old"), false);

  const max = buildWatchedNumbers(items, "Max");
  assert.equal(max.get("max-old"), 1);
  assert.equal(max.get("max-new"), 2);
});