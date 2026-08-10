import { describe, expect, it } from "vitest";
import {
  buildFormPayload,
  emptyValueForField,
  getRecordId,
  initFormValues,
  matchRecordId,
  normalizeCreatedRow,
  resolveRecordIdField,
} from "../crudFormUtils";
import type { CrudFormFieldSchema } from "../config";

describe("crudFormUtils", () => {
  it("resolveRecordIdField defaults to id", () => {
    expect(resolveRecordIdField()).toBe("id");
    expect(resolveRecordIdField("")).toBe("id");
    expect(resolveRecordIdField("_id")).toBe("_id");
  });

  it("getRecordId reads configured field then falls back to id/_id", () => {
    expect(getRecordId({ _id: 42 }, "_id")).toBe("42");
    expect(getRecordId({ id: "abc" }, "id")).toBe("abc");
    expect(getRecordId({ id: "abc" }, "_id")).toBe("abc");
    expect(getRecordId({ _id: "legacy" })).toBe("legacy");
    expect(getRecordId({ id: "api", _id: "mongo" })).toBe("api");
  });

  it("emptyValueForField is type-aware", () => {
    expect(emptyValueForField({ field: "a", label: "A", type: "number" })).toBeUndefined();
    expect(emptyValueForField({ field: "a", label: "A", type: "select" })).toBeUndefined();
    expect(emptyValueForField({ field: "a", label: "A", type: "switch" })).toBe(false);
    expect(emptyValueForField({ field: "a", label: "A", type: "input" })).toBe("");
    expect(
      emptyValueForField({
        field: "a",
        label: "A",
        type: "number",
        defaultValue: 3,
      }),
    ).toBe(3);
  });

  it("initFormValues maps null to typed empty and keeps real values", () => {
    const fields: CrudFormFieldSchema[] = [
      { field: "name", label: "Name", type: "input" },
      { field: "age", label: "Age", type: "number" },
      { field: "status", label: "Status", type: "select" },
      { field: "on", label: "On", type: "switch" },
    ];
    const target: Record<string, unknown> = { stale: 1 };
    initFormValues(
      fields,
      { name: "Tom", age: null, status: "ok", on: true },
      target,
    );
    expect(target).toEqual({
      name: "Tom",
      age: undefined,
      status: "ok",
      on: true,
    });
  });

  it("buildFormPayload omits hidden fields and cleans number empty string", () => {
    const fields: CrudFormFieldSchema[] = [
      { field: "name", label: "Name", type: "input" },
      { field: "secret", label: "Secret", type: "input", hiddenOnCreate: true },
      { field: "age", label: "Age", type: "number" },
    ];
    const payload = buildFormPayload(
      fields,
      { name: "A", secret: "x", age: "" },
      "add",
    );
    expect(payload).toEqual({ name: "A" });
  });

  it("normalizeCreatedRow maps id aliases onto recordIdField", () => {
    expect(
      normalizeCreatedRow({ id: "1", name: "n" }, { name: "n" }, "_id"),
    ).toEqual({ id: "1", name: "n", _id: "1" });
    expect(
      normalizeCreatedRow({ _id: "2" }, {}, "id"),
    ).toEqual({ _id: "2", id: "2" });
    expect(
      normalizeCreatedRow({ id: "3", name: "n" }, { name: "n" }),
    ).toEqual({ id: "3", name: "n" });
  });

  it("matchRecordId compares loosely across number/string", () => {
    expect(matchRecordId(1, "1")).toBe(true);
    expect(matchRecordId("1", 1)).toBe(true);
    expect(matchRecordId(1, 2)).toBe(false);
    expect(matchRecordId(null, "1")).toBe(false);
  });
});
