import type { WidgetMockBundle } from "../base/widgetMock";

export const kanbanMockRows = [
  { id: "1", title: "督办事items A", status: "open", severity: "high" },
  { id: "2", title: "督办事items B", status: "in_progress", severity: "medium" },
  { id: "3", title: "督办事items C", status: "closed", severity: "low" },
];

export const kanbanMock: WidgetMockBundle = {
  kind: "table",
  rows: kanbanMockRows,
};
