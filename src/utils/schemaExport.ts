/**
 * Schema Export/Import utilities
 *
 * Export: only definition state (name, type, json), no id/createdAt business identifiers
 * Import: client basic validation then submit to server strict validation
 */

import type { SchemaDetail } from "@/types/api";

export interface ExportedSchema {
  name: string;
  type: string;
  json: unknown;
  exportedAt: string;
  version: "1.0";
}

/**
 * Serialize Schema to exportable JSON string
 * Only includes definition state data, removes id/editId/version/createdAt etc.
 */
export function exportSchemaJson(schema: SchemaDetail): string {
  const exported: ExportedSchema = {
    name: schema.name,
    type: schema.type,
    json: schema.json,
    exportedAt: new Date().toISOString(),
    version: "1.0",
  };
  return JSON.stringify(exported, null, 2);
}

/**
 * Trigger browser download of JSON file
 */
export function downloadSchemaJson(schema: SchemaDetail): void {
  const json = exportSchemaJson(schema);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${schema.name || "schema"}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Parse imported Schema from file
 * Do client basic validation, detailed validation done by server
 */
export function parseImportFile(
  file: File,
): Promise<{ name: string; type: string; json: unknown[] }> {
  return new Promise((resolve, reject) => {
    if (!file.name.endsWith(".json")) {
      reject(new Error("Please select .json file"));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string);

        if (!parsed.name || typeof parsed.name !== "string") {
          reject(new Error("Invalid Schema file: missing name field"));
          return;
        }
        if (!parsed.json || !Array.isArray(parsed.json)) {
          reject(new Error("Invalid Schema file: json field must be an array"));
          return;
        }
        if (
          parsed.type &&
          !["form", "search-list", "search_list"].includes(parsed.type)
        ) {
          reject(
            new Error("Invalid Schema file: type must be form or search-list"),
          );
          return;
        }

        resolve({
          name: parsed.name,
          type: parsed.type || "form",
          json: parsed.json,
        });
      } catch {
        reject(new Error("Invalid JSON file"));
      }
    };
    reader.onerror = () => reject(new Error("File read failed"));
    reader.readAsText(file);
  });
}
