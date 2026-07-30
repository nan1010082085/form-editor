import type { WidgetConfig } from "../base/types";

export const userManagementConfig: WidgetConfig = {
  name: "FgUserManagement",
  displayName: "User Management",
  description: "User management table",
  author: "yangdongnan",
  defaultStyle: {
    width: "100%",
    height: "600px",
  },
  defaultProps: {
    tableColumns: [
      "username",
      "displayName",
      "deptId",
      "phone",
      "status",
      "createdAt",
    ],
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
  receivableEvents: [{ name: "refresh", description: "Refresh Users" }],
  propertyPanel: {
    basic: ["label"],
    style: [],
    props: [
      {
        key: "tableColumns",
        label: "Show Columns",
        type: "json",
        desc: "数组格式，可选值: username / displayName / deptId / phone / status / createdAt",
        default: [
          "username",
          "displayName",
          "deptId",
          "phone",
          "status",
          "createdAt",
        ],
      },
      { key: "pageSize", label: "Page Size", type: "number", default: 20 },
      { key: "searchable", label: "Show Search", type: "switch", default: true },
    ],
  },
};
