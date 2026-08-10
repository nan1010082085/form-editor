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
      { key: "open", title: "To Do", status: "open" },
      { key: "progress", title: "In progress", status: "in_progress" },
      { key: "done", title: "Done", status: "closed" },
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
      { key: "cardSubtitleField", label: "Subtitle Field", type: "input" },
      { key: "statusField", label: "Status Field", type: "input" },
    ],
  },
};
