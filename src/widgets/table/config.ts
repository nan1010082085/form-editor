import type { WidgetConfig } from "../base/types";

export interface TableColumn {
  prop: string;
  label: string;
  width?: number | "auto";
  minWidth?: number;
  fixed?: "left" | "right";
  sortable?: boolean | "custom";
  filterable?: boolean;
  filters?: Array<{ text: string; value: unknown }>;
  filterMethod?: (value: unknown, row: Record<string, unknown>) => boolean;
}

export interface PaginationConfig {
  enabled: boolean;
  pageSize: number;
  pageSizes: number[];
}

export interface SelectionConfig {
  enabled: boolean;
}

export const tableConfig: WidgetConfig = {
  name: "FgTable",
  displayName: "表格",
  description: "Data table with columns/pagination/sort/filter/selection",
  author: "yangdongnan",
  defaultStyle: {
    width: "100%",
    height: "300px",
  },
  defaultProps: {
    columns: [
      { prop: "name", label: "Name", width: 120 },
      { prop: "age", label: "Age", width: 80 },
    ] as TableColumn[],
    stripe: true,
    border: true,
    height: 280,
    sortable: false,
    filterable: false,
    pagination: {
      enabled: true,
      pageSize: 20,
      pageSizes: [10, 20, 50, 100],
    } as PaginationConfig,
    selection: {
      enabled: false,
    } as SelectionConfig,
  },
  exposedValues: [
    { key: "loading", type: "boolean", description: "Loading State" },
    { key: "tableData", type: "array", description: "Table Data" },
    { key: "selectedRows", type: "array", description: "Selected Row Data" },
  ],
  configPanels: ["api", "variables"],
  receivableEvents: [
    { name: "refresh", description: "Reload Table" },
    {
      name: "set-data",
      description: "Set Table Data",
      params: { data: "数据数组" },
    },
    {
      name: "set-search-params",
      description: "Set Search Params",
      params: { params: "参数对象" },
    },
  ],
  propertyPanel: {
    basic: ["label"],
    style: [],
    props: [
      { key: "columns", label: "Column Config", type: "columns" },
      { key: "stripe", label: "Stripe", type: "switch" },
      { key: "border", label: "Border", type: "switch" },
      { key: "height", label: "表格高度", type: "number" },
      { key: "sortable", label: "Global Sort", type: "switch" },
      { key: "filterable", label: "Global Filter", type: "switch" },
      { key: "selection.enabled", label: "Row Select", type: "switch" },
      { key: "pagination.enabled", label: "Pagination", type: "switch" },
      { key: "pagination.pageSize", label: "Page Size", type: "number" },
    ],
  },
};
