/**
 * Gantt Chart Widget - 项目排期/任务Hrs间线Display
 *
 * 基于 ECharts 实现, 适用于项目Management、任务排期、进度跟踪
 * Input：tasks 数组 [{ name, start, end, status, progress }]
 * Output：可视化Gantt Chart
 */

import type { WidgetConfig } from "../base/types";

export const ganttChartConfig: WidgetConfig = {
  name: "FgGanttChart",
  displayName: "Gantt Chart",
  description: "Project timeline Gantt chart for task scheduling and progress tracking",
  author: "yangdongnan",
  defaultStyle: { width: "100%", height: "400px" },
  defaultProps: {
    staticData: [],
    taskField: "name",
    startField: "start",
    endField: "end",
    statusField: "status",
    progressField: "progress",
    title: "",
    showProgress: true,
    showStatus: true,
    dateFormat: "YYYY-MM-DD",
    colorScheme: "default",
    customColors: ["#5470c6", "#91cc75", "#fac858", "#ee6666", "#73c0de"],
    rowHeight: 32,
    headerHeight: 40,
  },
  exposedValues: [
    { key: "loading", type: "boolean", description: "Loading state" },
    { key: "taskData", type: "array", description: "Task data" },
    { key: "selectedTask", type: "string", description: "Selected task name" },
  ],
  configPanels: ["api", "variables", "events"],
  propertyPanel: {
    basic: ["label"],
    style: ["backgroundColor"],
    props: [
      {
        key: "staticData",
        label: "Static Data",
        type: "array-editor",
        fields: [
          { key: "name", label: "Task Name", type: "text" },
          { key: "start", label: "Start Date", type: "text" },
          { key: "end", label: "End Date", type: "text" },
          { key: "status", label: "Status", type: "select", options: [
            { label: "Pending", value: "pending" },
            { label: "In Progress", value: "active" },
            { label: "Done", value: "done" },
            { label: "Delayed", value: "delayed" },
          ]},
          { key: "progress", label: "Progress (%)", type: "number" },
        ],
      },
      { key: "taskField", label: "Task Field", type: "text", default: "name" },
      { key: "startField", label: "Start Date Field", type: "text", default: "start" },
      { key: "endField", label: "End Date Field", type: "text", default: "end" },
      { key: "statusField", label: "Status Field", type: "text", default: "status" },
      { key: "progressField", label: "Progress Field", type: "text", default: "progress" },
      { key: "title", label: "Chart Title", type: "text", default: "" },
      { key: "showProgress", label: "Show Progress", type: "switch", default: true },
      { key: "showStatus", label: "Show Status", type: "switch", default: true },
      { key: "rowHeight", label: "Row Height", type: "number", default: 32 },
      { key: "colorScheme", label: "Color Scheme", type: "select", default: "default", options: [
        { label: "Default", value: "default" },
        { label: "Status-based", value: "status" },
      ]},
    ],
  },
};
