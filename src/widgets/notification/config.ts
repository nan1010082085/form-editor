import type { WidgetConfig } from "../base/types";
import { notificationMock } from "./mock";

export const notificationConfig: WidgetConfig = {
  name: "FgNotification",
  displayName: "Notice",
  description: "Published notice list",
  author: "yangdongnan",
  defaultStyle: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: "8px",
    padding: "12px",
  },
  exposedValues: [{ key: "items", type: "array", description: "Notice List" }],
  configPanels: ["events", "variables"],
  defaultProps: {
    title: "Latest Notice",
    pageSize: 5,
    source: "notices",
    staticData: notificationMock.staticData.items,
  },
  propertyPanel: {
    basic: ["label"],
    style: ["margin", "padding"],
    props: [
      { key: "title", label: "Title", type: "input", default: "Latest Notice" },
      {
        key: "source",
        label: "Data Source",
        type: "select",
        default: "notices",
        options: [
          { label: "Notice", value: "notices" },
          { label: "Flow Message", value: "flow" },
        ],
      },
      { key: "pageSize", label: "Count", type: "number", default: 5 },
    ],
  },
};
