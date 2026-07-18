import test from "node:test";
import assert from "node:assert/strict";
import { parseBackupText } from "../src/backup.mjs";

test("imports a valid Seansownik backup", () => {
  const result = parseBackupText(JSON.stringify({
    version: 1,
    items: [{ id: "1", title: "Diuna", status: "watched", platform: "Max", rating: 8 }]
  }));

  assert.equal(result.items.length, 1);
  assert.equal(result.items[0].title, "Diuna");
});

test("rejects malformed JSON and unsupported formats", () => {
  assert.throws(() => parseBackupText("not json"), /prawidłową kopią/);
  assert.throws(() => parseBackupText(JSON.stringify({ version: 2, items: [] })), /Nieobsługiwany format/);
});

test("rejects corrupted entries without touching current data", () => {
  const broken = JSON.stringify({ version: 1, items: [{ id: "1", title: "", status: "watched", platform: "Max" }] });
  assert.throws(() => parseBackupText(broken), /nie ma tytułu/);
});