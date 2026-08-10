import type { TableWidgetMock } from "../base/widgetMock";

/**
 * 高级表格 — Default mock（请假台账场景）
 * 设计器未Config API Hrs在画布展示, 便于排布Column tag/Button/tooltip。
 *
 * Field采用扁平结构以便设计器预览（运RowHrs API 可能为 data.xxx, 见 E-03）。
 */
export const advancedTableMock: TableWidgetMock = {
  kind: "table",
  total: 5,
  rows: [
    {
      _id: "LV20260001",
      status: "submitted",
      createdAt: "2026-06-28 09:15",
      applicantName: "Zhang San",
      leaveType: "annual",
      days: 3,
      reason: "家庭事务处理, 需请假三day。",
      deptName: "研发部",
    },
    {
      _id: "LV20260002",
      status: "approved",
      createdAt: "2026-06-27 14:20",
      applicantName: "Li Si",
      leaveType: "sick",
      days: 1,
      reason: "身体不适, 申请病假一day, 已附诊断证明。",
      deptName: "产品部",
    },
    {
      _id: "LV20260003",
      status: "rejected",
      createdAt: "2026-06-26 11:00",
      applicantName: "Wang Wu",
      leaveType: "personal",
      days: 2,
      reason: "个人原因请假。",
      deptName: "人事部",
    },
    {
      _id: "LV20260004",
      status: "submitted",
      createdAt: "2026-06-25 16:45",
      applicantName: "Zhao Liu",
      leaveType: "annual",
      days: 5,
      reason: "year假休息。",
      deptName: "财务部",
    },
    {
      _id: "LV20260005",
      status: "approved",
      createdAt: "2026-06-24 08:30",
      applicantName: "Qian Qi",
      leaveType: "marriage",
      days: 10,
      reason: "婚假。",
      deptName: "Row政部",
    },
  ],
};
