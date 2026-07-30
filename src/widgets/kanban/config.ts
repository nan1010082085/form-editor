import type { WidgetConfig } from "../base/types";

export interface KanbanColumn {
  key: string;
  title: string;
  status: string;
}

export const kanbanConfig: WidgetConfig = {
  name: "FgKanban",
  displayName: "Kanban",
  description: "Kanban board with drag-to-change-status",
  author: "yangdongnan",
  defaultStyle: { width: "100%", minHeight: "420px" },
  defaultProps: {
    columns: [
      { key: "open", title: "待办", status: "open" },
      { key: "progress", title: "进行中", status: "in_progress" },
      { key: "done", title: "已关闭", status: "closed" },
    ] as KanbanColumn[],
    cardTitleField: "title",
    cardSubtitleField: "severity",
    statusField: "status",
    updateMethod: "put",
  },
  exposedValues: [
    { key: "cards", type: "array", description: "Card Data" },
    { key: "loading", type: "boolean", description: "Loading State" },
  ],
  configPanels: ["api", "variables"],
  receivableEvents: [{ name: "refresh", description: "Reload Kanban" }],
  propertyPanel: {
    basic: ["label"],
    style: ["width", "height"],
    props: [
      { key: "columns", label: "Column Config", type: "kanban-columns" },
      { key: "cardTitleField", label: "Title Field", type: "input" },
      { key: "cardSubtitleField", label: "副标题字段", type: "input" },
      { key: "statusField", label: "Status Field", type: "input" },
    ],
  },
};
