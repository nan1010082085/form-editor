import { nanoid } from "nanoid";
import type { Widget } from "../base/types";

export function createGanttChartWidget(id?: string): Widget {
  return {
    id: id ?? nanoid(),
    name: "FgGanttChart",
    type: "gantt-chart",
    field: "ganttChart",
    label: "Gantt Chart",
    props: {
      staticData: [
        { name: "Task 1", start: "2026-01-01", end: "2026-01-15", status: "done", progress: 100 },
        { name: "Task 2", start: "2026-01-10", end: "2026-01-25", status: "active", progress: 60 },
        { name: "Task 3", start: "2026-01-20", end: "2026-02-05", status: "pending", progress: 0 },
      ],
      taskField: "name",
      startField: "start",
      endField: "end",
      statusField: "status",
      progressField: "progress",
      title: "",
      showProgress: true,
      showStatus: true,
      rowHeight: 32,
      colorScheme: "default",
    },
    style: { width: "100%", height: "400px" },
    position: { x: 0, y: 0, w: 400, h: 300, zIndex: 1 },
    children: [],
  };
}
