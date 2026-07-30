import type {
  WidgetConfig,
  SchemaEventAction,
  EventTargetConfig,
  Widget,
} from "../base/types";
import type {
  SchemaApiConfig,
  SearchFieldSchema,
} from "@/components/WidgetRenderer/types";

// ============================================================
// 高级表格类型定义
// ============================================================

/** 行内按钮事件配置 */
export interface ButtonEventConfig {
  trigger: string;
  condition?: string;
  confirm?: string;
  actions: SchemaEventAction[];
}

/** 操作按钮（工具栏 / 行内共用） */
export interface ActionButton {
  key: string;
  label: string;
  type?: "" | "primary" | "success" | "warning" | "danger" | "info" | "text";
  icon?: string;
  size?: "small" | "default";
  confirm?: string;
  visibleCondition?: string;
  params?: Record<string, unknown>;
  events?: ButtonEventConfig[];
}

/** 高级列定义 */
export interface AdvancedTableColumn {
  prop: string;
  label: string;
  width?: number | "auto";
  minWidth?: number;
  fixed?: "left" | "right";
  sortable?: boolean | "custom";
  align?: "left" | "center" | "right";
  render?:
    | "text"
    | "link"
    | "tag"
    | "badge"
    | "image"
    | "buttons"
    | "custom"
    | "flowStatus"
    | "tooltip"
    | "expiryAlert";
  // tooltip
  showTooltip?: boolean;
  tooltipField?: string;
  // link
  linkEvent?: string;
  // tag/badge
  colorMap?: Record<string, string>;
  options?: Array<{ label: string; value: string | number }>;
  dictCode?: string;
  api?: SchemaApiConfig;
  // image
  imageWidth?: number;
  // buttons
  buttons?: ActionButton[];
  // custom
  renderFn?: string;
  // filter
  filterable?: boolean;
  filters?: Array<{ text: string; value: unknown }>;
  filterMethod?: (
    value: unknown,
    row: Record<string, unknown>,
    column: { property: string },
  ) => boolean;
}

/** 分页配置 */
export interface AdvPaginationConfig {
  enabled: boolean;
  pageSize: number;
  pageSizes: number[];
}

/** 多选配置 */
export interface AdvSelectionConfig {
  enabled: boolean;
}

/** E-32 列表搜索区字段（与 SearchFieldSchema 对齐） */
export type SearchField = SearchFieldSchema;

/** 搜索区配置 */
export interface SearchBarConfig {
  enabled?: boolean;
  fields: SearchField[];
}

// ============================================================
// Widget Config
// ============================================================

export const advancedTableConfig: WidgetConfig = {
  name: "FgAdvancedTable",
  displayName: "Advanced Table",
  description:
    "Business data table with mock/API",
  author: "yangdongnan",
  defaultStyle: {
    width: "100%",
    height: "400px",
  },
  defaultProps: {
    columns: [
      { prop: "applicantName", label: "Applicant", minWidth: 100, render: "text" },
      {
        prop: "leaveType",
        label: "Leave Type",
        minWidth: 90,
        render: "tag",
        filterable: true,
        options: [
          { label: "Annual Leave", value: "annual" },
          { label: "Sick Leave", value: "sick" },
          { label: "Personal Leave", value: "personal" },
          { label: "Marriage Leave", value: "marriage" },
        ],
      },
      {
        prop: "days",
        label: "Days",
        width: 80,
        align: "center",
        render: "text",
      },
      {
        prop: "status",
        label: "Status",
        minWidth: 100,
        render: "tag",
        filterable: true,
        colorMap: {
          submitted: "warning",
          approved: "success",
          rejected: "danger",
        },
        options: [
          { label: "Pending", value: "submitted" },
          { label: "Approved", value: "approved" },
          { label: "Rejected", value: "rejected" },
        ],
      },
      {
        prop: "reason",
        label: "Reason",
        minWidth: 180,
        render: "text",
        showTooltip: true,
      },
      {
        prop: "action",
        label: "Action",
        width: 160,
        fixed: "right",
        render: "buttons",
        buttons: [
          { key: "view", label: "View", type: "primary", size: "small" },
          { key: "approve", label: "Approval", type: "success", size: "small" },
        ],
      },
    ] as AdvancedTableColumn[],
    toolbar: [
      { key: "add", label: "Start Request", type: "primary", icon: "plus" },
      { key: "export", label: "Export", type: "" },
    ] as ActionButton[],
    stripe: true,
    border: true,
    height: 350,
    sortable: false,
    serverSideFilter: true,
    /** 虚拟滚动：数据 >100 行时用 el-table-v2 渲染（复杂列特性降级） */
    virtual: false,
    pagination: {
      enabled: true,
      pageSize: 20,
      pageSizes: [10, 20, 50, 100],
    } as AdvPaginationConfig,
    selection: {
      enabled: true,
    } as AdvSelectionConfig,
    searchBar: {
      enabled: false,
      fields: [],
    } as SearchBarConfig,
  },
  exposedValues: [
    { key: "loading", type: "boolean", description: "Loading State" },
    { key: "tableData", type: "array", description: "Table Data" },
    { key: "selectedRows", type: "array", description: "Selected Row Data" },
    { key: "selectedCount", type: "number", description: "Selected Count" },
  ],
  configPanels: ["events", "api", "variables"],
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
    { name: "clear-selection", description: "Clear Row Selection" },
  ],
  eventTargets: (widget: Widget): EventTargetConfig[] => {
    const targets: EventTargetConfig[] = [
      { id: "row-click", label: "Row Click" },
      { id: "selection-change", label: "Selection Change" },
      { id: "sort-change", label: "Sort Change" },
      { id: "page-change", label: "Page Flip" },
    ];
    // 工具栏按钮 → eventTarget: toolbar-{key}
    const toolbar = (widget.props?.toolbar as ActionButton[]) || [];
    for (const btn of toolbar) {
      targets.push({ id: `toolbar-${btn.key}`, label: `工具栏: ${btn.label}` });
    }
    // 行内按钮 → eventTarget: row-{key}
    const columns = (widget.props?.columns as AdvancedTableColumn[]) || [];
    const seenRowKeys = new Set<string>();
    for (const col of columns) {
      if (col.render === "buttons" && col.buttons) {
        for (const btn of col.buttons) {
          if (!seenRowKeys.has(btn.key)) {
            seenRowKeys.add(btn.key);
            targets.push({
              id: `row-${btn.key}`,
              label: `行按钮: ${btn.label}`,
            });
          }
        }
      }
      if (col.render === "link" && col.linkEvent) {
        targets.push({ id: `link-${col.prop}`, label: `链接: ${col.label}` });
      }
    }
    return targets;
  },
  propertyPanel: {
    basic: ["label"],
    style: [],
    props: [
      { key: "columns", label: "Column Config", type: "advanced-columns" },
      { key: "toolbar", label: "Toolbar Buttons", type: "action-buttons" },
      { key: "searchBar.enabled", label: "Search Area", type: "switch" },
      { key: "searchBar.fields", label: "Search Field", type: "search-fields" },
      { key: "selection.enabled", label: "Row Select", type: "switch" },
      { key: "stripe", label: "Stripe", type: "switch" },
      { key: "border", label: "Border", type: "switch" },
      { key: "height", label: "表格高度", type: "number" },
      {
        key: "virtual",
        label: "Virtual Scroll",
        type: "switch",
        desc: "数据 >100 行时启用，大幅提升大列表性能",
      },
      { key: "sortable", label: "Global Sort", type: "switch" },
      { key: "pagination.enabled", label: "Pagination", type: "switch" },
      { key: "pagination.pageSize", label: "Page Size", type: "number" },
    ],
  },
};
