import type { WidgetConfig } from "../base/types";

export interface AdhocQueryField {
  field: string;
  label: string;
  type?: "input" | "select";
  options?: Array<{ label: string; value: string | number }>;
}

export interface AdhocCondition {
  field: string;
  operator: "eq" | "contains";
  value: string;
}

export const adhocQueryConfig: WidgetConfig = {
  name: "FgAdhocQuery",
  displayName: "Adhoc Query",
  description: "Visual filter builder for advanced table",
  author: "yangdongnan",
  defaultStyle: { width: "100%" },
  defaultProps: {
    targetTableId: "",
    fields: [
      { field: "keyword", label: "Keyword", type: "input" },
      {
        field: "status",
        label: "Status",
        type: "select",
        options: [
          { label: "Pending", value: "submitted" },
          { label: "Approved", value: "approved" },
          { label: "Rejected", value: "rejected" },
        ],
      },
    ] as AdhocQueryField[],
  },
  exposedValues: [
    { key: "lastParams", type: "object", description: "Last Query Params" },
  ],
  configPanels: ["variables"],
  receivableEvents: [{ name: "reset", description: "Clear Conditions and Reset Table" }],
  propertyPanel: {
    basic: ["label"],
    style: ["width"],
    props: [
      { key: "targetTableId", label: "Target Table ID", type: "input" },
      { key: "fields", label: "Optional Fields", type: "adhoc-fields" },
    ],
  },
};
