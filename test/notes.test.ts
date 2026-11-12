import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { run } from "../src/cli.ts";
import { addNote, deleteNote, filterByTag, formatList, NotesError, type Note } from "../src/notes.ts";

const DAY = "2026-11-06";
const tmpFile = () => join(mkdtempSync(join(tmpdir(), "notes-")), "notes.json");

describe("notes", () => {
  it("adds a note with the next id", () => {
    const notes = addNote(addNote([], "first", DAY), "second", DAY);
    expect(notes.map((n) => n.id)).toEqual([1, 2]);
  });

  it("trims text and refuses empty notes", () => {
    expect(addNote([], "  hi  ", DAY)[0].text).toBe("hi");
    expect(() => addNote([], "   ", DAY)).toThrow(NotesError);
  });

  it("deletes by id and refuses unknown ids", () => {
    const notes: Note[] = addNote([], "a", DAY);
    expect(deleteNote(notes, 1)).toEqual([]);
    expect(() => deleteNote(notes, 9)).toThrow("no note with id 9");
  });

  it("formats a list", () => {
    expect(formatList([])).toBe("No notes yet.");
    expect(formatList(addNote([], "milk", DAY))).toBe("1. milk (2026-11-06)");
  });
});

describe("cli", () => {
  it("adds and lists notes in the file", () => {
    const file = tmpFile();
    expect(run(["add", "buy", "milk"], file, DAY)).toEqual({ code: 0, out: "Added note 1." });
    expect(run(["list"], file, DAY).out).toBe("1. buy milk (2026-11-06)");
  });

  it("deletes a note", () => {
    const file = tmpFile();
    run(["add", "x"], file, DAY);
    expect(run(["delete", "1"], file, DAY).code).toBe(0);
    expect(run(["list"], file, DAY).out).toBe("No notes yet.");
  });

  it("reports errors with exit code 1", () => {
    const file = tmpFile();
    writeFileSync(file, "{ not json");
    expect(run(["list"], file, DAY).code).toBe(1);
    expect(run(["delete", "3"], tmpFile(), DAY)).toEqual({ code: 1, out: "error: no note with id 3" });
  });

  it("prints usage for unknown commands", () => {
    expect(run(["fly"], tmpFile(), DAY).code).toBe(2);
  });
});

describe("tags (notes)", () => {
  it("stores normalized tags", () => {
    const [note] = addNote([], "a", DAY, [" Work ", "work", "Urgent"]);
    expect(note.tags).toEqual(["work", "urgent"]);
  });

  it("stores no tags key without tags", () => {
    expect("tags" in addNote([], "a", DAY)[0]).toBe(false);
    expect(addNote([], "a", DAY, [])[0]).toEqual({ id: 1, text: "a", created: DAY });
  });

  it("refuses empty tags", () => {
    expect(() => addNote([], "a", DAY, ["  "])).toThrow(NotesError);
    expect(() => addNote([], "a", DAY, [""])).toThrow(NotesError);
  });

  it("filters by tag case-insensitively and ignores untagged notes", () => {
    const notes = addNote(addNote([], "plain", DAY), "task", DAY, ["work"]);
    expect(filterByTag(notes, "WORK").map((n) => n.text)).toEqual(["task"]);
    expect(filterByTag(notes, "nope")).toEqual([]);
  });

  it("shows tags in the list", () => {
    const notes = addNote(addNote([], "plain", DAY), "task", DAY, ["a", "b"]);
    expect(formatList(notes)).toBe("1. plain (2026-11-06)\n2. task (2026-11-06) [a, b]");
  });
});

describe("tags (cli)", () => {
  const stored = (file: string) => JSON.parse(readFileSync(file, "utf8"));

  it("adds with repeated --tag", () => {
    const file = tmpFile();
    expect(run(["add", "--tag", "work", "--tag", "urgent", "write", "report"], file, DAY)).toEqual({ code: 0, out: "Added note 1." });
    expect(stored(file)[0]).toMatchObject({ text: "write report", tags: ["work", "urgent"] });
  });

  it("accepts --tag after the text", () => {
    const file = tmpFile();
    run(["add", "write", "report", "--tag", "work"], file, DAY);
    expect(stored(file)[0]).toMatchObject({ text: "write report", tags: ["work"] });
  });

  it("errors on add --tag without value", () => {
    const result = run(["add", "hi", "--tag"], tmpFile(), DAY);
    expect(result.code).toBe(1);
    expect(result.out).toMatch(/^error: /);
  });

  it("lists only matching notes", () => {
    const file = tmpFile();
    run(["add", "--tag", "work", "job"], file, DAY);
    run(["add", "home"], file, DAY);
    expect(run(["list", "--tag", "work"], file, DAY).out).toBe("1. job (2026-11-06) [work]");
    expect(run(["list", "--tag", "nope"], file, DAY)).toEqual({ code: 0, out: "No notes yet." });
  });

  it("lists everything without --tag, including legacy files", () => {
    const file = tmpFile();
    writeFileSync(file, JSON.stringify([{ id: 1, text: "old", created: DAY }]));
    expect(run(["list"], file, DAY).out).toBe("1. old (2026-11-06)");
    expect(run(["list", "--tag", "x"], file, DAY).out).toBe("No notes yet.");
  });

  it("errors on list --tag without value", () => {
    expect(run(["list", "--tag"], tmpFile(), DAY).code).toBe(1);
  });
});
