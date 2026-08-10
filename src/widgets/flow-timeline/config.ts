import type { WidgetConfig } from "../base/types";
import { flowTimelineMock } from "./mock";

export const flowTimelineConfig: WidgetConfig = {
  name: "FgFlowTimeline",
  displayName: "Flow Timeline",
  description: "Approval timeline display",
  author: "yangdongnan",
  defaultStyle: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: "8px",
    padding: "16px",
  },
  exposedValues: [
    { key: "logs", type: "array", description: "Approval log list" },
    { key: "loading", type: "boolean", description: "Loading State" },
  ],
  configPanels: ["events", "variables"],
  defaultProps: {
    title: "Approval Records",
    instanceIdVariable: "flowInstanceId",
    staticData: flowTimelineMock.staticData.logs,
  },
  propertyPanel: {
    basic: ["label"],
    style: ["margin", "padding"],
    props: [
      { key: "title", label: "Title", type: "input", default: "Approval Records" },
      {
        key: "instanceIdVariable",
        label: "Instance ID Var Name",
        type: "input",
        default: "flowInstanceId",
      },
      {
        key: "instanceId",
        label: "Fixed Instance ID",
        type: "input",
        desc: "Leave empty to read from board variables",
      },
    ],
  },
};
