import type { WidgetConfig } from "../base/types";

export const roleManagementConfig: WidgetConfig = {
  name: "FgRoleManagement",
  displayName: "Role Management",
  description: "Role management table",
  author: "yangdongnan",
  defaultStyle: {
    width: "100%",
    height: "600px",
  },
  defaultProps: {
    tableColumns: ["name", "permissions", "data_scope", "createdAt"],
    pageSize: 20,
    searchable: true,
  },
  configPanels: ["events", "variables"],
  exposedValues: [
    { key: "loading", type: "boolean", description: "Loading State" },
    { key: "tableData", type: "array", description: "Table Data" },
    { key: "total", type: "number", description: "Total" },
    { key: "selectedRows", type: "array", description: "Selected Rows" },
  ],
  receivableEvents: [{ name: "refresh", description: "Refresh Roles" }],
  propertyPanel: {
    basic: ["label"],
    style: [],
    props: [
      {
        key: "tableColumns",
        label: "Show Columns",
        type: "json",
        desc: "Array format, optional values: name / permissions / data_scope / createdAt",
        default: ["name", "permissions", "data_scope", "createdAt"],
      },
      { key: "pageSize", label: "Page Size", type: "number", default: 20 },
      { key: "searchable", label: "Show Search", type: "switch", default: true },
    ],
  },
};
