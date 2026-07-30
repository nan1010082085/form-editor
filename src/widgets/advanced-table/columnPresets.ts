/** E-35 — 列模板库（常用业务台账配方） */
import type { AdvancedTableColumn } from "./config";

export interface ColumnPreset {
  id: string;
  label: string;
  columns: AdvancedTableColumn[];
}

export const COLUMN_PRESETS: ColumnPreset[] = [
  {
    id: "leave-ledger",
    label: "Leave Ledger",
    columns: [
      {
        prop: "_id",
        label: "ID",
        minWidth: 120,
        render: "link",
        linkEvent: "open-detail",
      },
      { prop: "submitterName", label: "Applicant", minWidth: 100, render: "text" },
      {
        prop: "data.leaveType",
        label: "Type",
        minWidth: 90,
        render: "tag",
        filterable: true,
      },
      {
        prop: "data.days",
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
      },
      {
        prop: "flowStatus",
        label: "Flow Status",
        minWidth: 110,
        render: "flowStatus",
      },
      { prop: "createdAt", label: "Applied", minWidth: 160, render: "text" },
      {
        prop: "action",
        label: "Actions",
        width: 120,
        fixed: "right",
        render: "buttons",
        buttons: [
          {
            key: "view",
            label: "View",
            type: "primary",
            size: "small",
            icon: "view",
          },
        ],
      },
    ],
  },
  {
    id: "expense-ledger",
    label: "Expense Ledger",
    columns: [
      {
        prop: "_id",
        label: "Expense ID",
        minWidth: 120,
        render: "link",
        linkEvent: "open-detail",
      },
      { prop: "submitterName", label: "Applicant", minWidth: 100, render: "text" },
      {
        prop: "data.totalAmount",
        label: "Amount",
        minWidth: 100,
        align: "right",
        render: "text",
      },
      {
        prop: "status",
        label: "Status",
        minWidth: 100,
        render: "tag",
        filterable: true,
      },
      {
        prop: "flowStatus",
        label: "Flow",
        minWidth: 100,
        render: "flowStatus",
      },
      { prop: "createdAt", label: "Time", minWidth: 160, render: "text" },
      {
        prop: "action",
        label: "Actions",
        width: 120,
        fixed: "right",
        render: "buttons",
        buttons: [
          { key: "view", label: "View", type: "primary", size: "small" },
        ],
      },
    ],
  },
  {
    id: "audit-issues",
    label: "Audit Issues",
    columns: [
      {
        prop: "code",
        label: "Issue ID",
        minWidth: 120,
        render: "link",
        linkEvent: "open-detail",
      },
      {
        prop: "severity",
        label: "Severity",
        minWidth: 100,
        render: "tag",
        filterable: true,
      },
      {
        prop: "description",
        label: "Description",
        minWidth: 200,
        render: "text",
        showTooltip: true,
      },
      { prop: "ownerDept", label: "Responsible Dept", minWidth: 120, render: "text" },
      {
        prop: "status",
        label: "Rectification Status",
        minWidth: 100,
        render: "tag",
        filterable: true,
      },
      {
        prop: "action",
        label: "Actions",
        width: 120,
        fixed: "right",
        render: "buttons",
        buttons: [
          { key: "view", label: "View", type: "primary", size: "small" },
        ],
      },
    ],
  },
];
