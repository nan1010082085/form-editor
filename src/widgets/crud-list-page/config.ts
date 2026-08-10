import type { WidgetConfig, EventTargetConfig, Widget } from "../base/types";
import type {
  ActionButton,
  AdvancedTableColumn,
  AdvPaginationConfig,
  AdvSelectionConfig,
  SearchBarConfig,
} from "../advanced-table/config";
import type { DescriptionItemConfig } from "../descriptions/config";

export interface CrudPageActions {
  applyNavigatePath?: string;
  approveNavigatePath?: string;
  export?: {
    apiUrl: string;
    filename: string;
  };
}

export interface CrudDetailDialogConfig {
  title?: string;
  detailApiUrl: string;
  descriptionItems: DescriptionItemConfig[];
  showFlowTimeline?: boolean;
  confirmNavigatePath?: string;
  confirmText?: string;
}

/** Create/EditDialogField */
export interface CrudFormFieldSchema {
  field: string;
  label: string;
  type?:
    | "input"
    | "number"
    | "select"
    | "textarea"
    | "switch"
    | "date"
    | "radio";
  required?: boolean;
  span?: number;
  placeholder?: string;
  options?: Array<{ label: string; value: string | number }>;
  defaultValue?: unknown;
  hiddenOnCreate?: boolean;
  hiddenOnEdit?: boolean;
}

/** Create/EditDialogConfig */
export interface CrudFormDialogConfig {
  title?: string;
  createTitle?: string;
  editTitle?: string;
  width?: string;
  fields: CrudFormFieldSchema[];
  createApiUrl?: string;
  updateApiUrl?: string;
  recordIdField?: string;
}

export const crudListPageConfig: WidgetConfig = {
  name: "FgCrudListPage",
  displayName: "CRUD List Page",
  description:
    "JeecgBoot-style list page",
  author: "yangdongnan",
  defaultStyle: {
    width: "100%",
    height: "780px",
  },
  defaultProps: {
    columns: [
      { prop: "applicantName", label: "Applicant", minWidth: 100, render: "text" },
      { prop: "status", label: "Status", minWidth: 100, render: "flowStatus" },
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
          { key: "edit", label: "Edit", type: "default", size: "small" },
          { key: "approve", label: "Approval", type: "success", size: "small" },
        ],
      },
    ] as AdvancedTableColumn[],
    toolbar: [
      { key: "add", label: "Start Request", type: "primary", icon: "plus" },
      { key: "export", label: "Export Excel", type: "default", icon: "download" },
    ] as ActionButton[],
    stripe: true,
    border: true,
    height: 680,
    sortable: false,
    serverSideFilter: true,
    pagination: {
      enabled: true,
      pageSize: 20,
      pageSizes: [10, 20, 50, 100],
    } as AdvPaginationConfig,
    selection: { enabled: false } as AdvSelectionConfig,
    searchBar: {
      enabled: true,
      fields: [],
    } as SearchBarConfig,
    pageActions: {} as CrudPageActions,
    detailDialog: {
      title: "Application details",
      detailApiUrl: "",
      descriptionItems: [
        { label: "Applicant", field: "applicantName", type: "text" },
        {
          label: "Status",
          field: "status",
          type: "tag",
          options: [
            { label: "Pending", value: "submitted", color: "warning" },
            { label: "Approved", value: "approved", color: "success" },
            { label: "Rejected", value: "rejected", color: "danger" },
          ],
        },
        { label: "Reason", field: "reason", type: "text", span: 2 },
      ],
      showFlowTimeline: true,
      confirmText: "Full screen approval",
    } as CrudDetailDialogConfig,
    formDialog: {
      createTitle: "Create",
      editTitle: "Edit",
      width: "640px",
      fields: [
        {
          field: "applicantName",
          label: "Applicant",
          type: "input",
          required: true,
          span: 24,
        },
        { field: "reason", label: "Reason", type: "textarea", span: 24 },
        {
          field: "status",
          label: "Status",
          type: "select",
          span: 24,
          options: [
            { label: "Pending", value: "submitted" },
            { label: "Approved", value: "approved" },
            { label: "Rejected", value: "rejected" },
          ],
        },
      ],
      createApiUrl: "",
      updateApiUrl: "",
      recordIdField: "id",
    } as CrudFormDialogConfig,
  },
  exposedValues: [
    { key: "loading", type: "boolean", description: "Loading State" },
    { key: "tableData", type: "array", description: "Table Data" },
    { key: "selectedRows", type: "array", description: "Selected Rows" },
  ],
  configPanels: ["events", "api", "variables"],
  receivableEvents: [
    { name: "refresh", description: "Reload List" },
    {
      name: "set-search-params",
      description: "Set Search Params",
      params: { params: "Parameter object" },
    },
  ],
  eventTargets: (widget: Widget): EventTargetConfig[] => {
    const targets: EventTargetConfig[] = [
      { id: "row-click", label: "Row Click" },
      { id: "selection-change", label: "Selection Change" },
    ];
    const toolbar = (widget.props?.toolbar as ActionButton[]) || [];
    for (const btn of toolbar) {
      targets.push({ id: `toolbar-${btn.key}`, label: `Toolbar: ${btn.label}` });
    }
    const columns = (widget.props?.columns as AdvancedTableColumn[]) || [];
    const seenRowKeys = new Set<string>();
    for (const col of columns) {
      if (col.render === "buttons" && col.buttons) {
        for (const btn of col.buttons) {
          if (!seenRowKeys.has(btn.key)) {
            seenRowKeys.add(btn.key);
            targets.push({
              id: `row-${btn.key}`,
              label: `Row button: ${btn.label}`,
            });
          }
        }
      }
      if (col.render === "link") {
        targets.push({ id: `link-${col.prop}`, label: `Link: ${col.label}` });
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
      { key: "height", label: "Table height", type: "number" },
      { key: "pagination.enabled", label: "Pagination", type: "switch" },
      { key: "pagination.pageSize", label: "Page Size", type: "number" },
      {
        key: "pageActions.applyNavigatePath",
        label: "Start Request Path",
        type: "text",
      },
      { key: "pageActions.export.apiUrl", label: "Export API", type: "text" },
      { key: "pageActions.export.filename", label: "Export Filename", type: "text" },
      {
        key: "pageActions.approveNavigatePath",
        label: "Approval Page Path",
        type: "text",
      },
      { key: "detailDialog.title", label: "Detail Dialog Title", type: "text" },
      { key: "detailDialog.detailApiUrl", label: "Detail API", type: "text" },
      {
        key: "detailDialog.descriptionItems",
        label: "Detail Fields",
        type: "array-editor",
        itemLabel: "label",
        fields: [
          {
            key: "label",
            label: "Label",
            type: "text",
            placeholder: "Display name",
          },
          {
            key: "field",
            label: "Field",
            type: "text",
            placeholder: "Data field name",
          },
          {
            key: "type",
            label: "Type",
            type: "select",
            default: "text",
            options: [
              { label: "Text", value: "text" },
              { label: "Tag", value: "tag" },
              { label: "Link", value: "link" },
              { label: "Date", value: "date" },
            ],
          },
          { key: "span", label: "Span", type: "number", default: 1 },
        ],
      },
      {
        key: "detailDialog.showFlowTimeline",
        label: "Approval Timeline",
        type: "switch",
      },
      {
        key: "detailDialog.confirmNavigatePath",
        label: "Fullscreen Approval Path",
        type: "text",
      },
      { key: "detailDialog.confirmText", label: "Fullscreen Approval Button", type: "text" },
      { key: "formDialog.createApiUrl", label: "Create API", type: "text" },
      { key: "formDialog.updateApiUrl", label: "Update API", type: "text" },
      {
        key: "formDialog.recordIdField",
        label: "Record ID Field",
        type: "text",
      },
      { key: "formDialog.fields", label: "Form Field", type: "crud-form-fields" },
      { key: "formDialog.width", label: "Dialog Width", type: "text" },
    ],
  },
};
