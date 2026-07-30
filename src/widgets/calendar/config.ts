import type { WidgetConfig } from "../base/types";
import { calendarMock } from "./mock";

export const calendarConfig: WidgetConfig = {
  name: "FgCalendar",
  displayName: "Calendar",
  description: "Calendar for schedule/meeting display",
  author: "yangdongnan",
  defaultStyle: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: "8px",
    padding: "12px",
  },
  exposedValues: [
    { key: "events", type: "array", description: "Schedule Events" },
  ],
  configPanels: ["events", "variables"],
  defaultProps: {
    title: "日程日历",
    staticData: calendarMock.staticData.events,
  },
  propertyPanel: {
    basic: ["label"],
    style: ["margin", "padding"],
    props: [
      { key: "title", label: "Title", type: "input", default: "日程日历" },
    ],
  },
};
