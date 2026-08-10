import type { WidgetConfig } from "../base/types";
import { approvalProcessMock } from "./mock";

export const approvalProcessConfig: WidgetConfig = {
  name: "FgApprovalProcess",
  displayName: "Approval Process",
  description: "Approval workflow visualization showing current node and history",
  author: "yangdongnan",
  defaultStyle: { width: "100%", height: "300px" },
  defaultProps: {
    ...approvalProcessMock.defaultProps,
  },
  configPanels: ["events", "variables"],
  exposedValues: [
    { key: "currentNode", type: "string", description: "Current approval node" },
    { key: "status", type: "string", description: "Current status (pending/approved/rejected)" },
  ],
  receivableEvents: [
    { name: "refresh", description: "Refresh process data" },
  ],
  propertyPanel: {
    basic: ["label"],
    style: ["margin", "padding", "backgroundColor", "borderRadius"],
    props: [
      {
        key: "orientation",
        label: "Orientation",
        type: "select",
        default: "horizontal",
        options: [
          { label: "Horizontal", value: "horizontal" },
          { label: "Vertical", value: "vertical" },
        ],
        desc: "Layout direction of the process flow",
      },
      {
        key: "showTimeline",
        label: "Show Timeline",
        type: "switch",
        default: true,
        desc: "Show timeline below/beside the process",
      },
      {
        key: "nodeSize",
        label: "Node Size",
        type: "select",
        default: "medium",
        options: [
          { label: "Small", value: "small" },
          { label: "Medium", value: "medium" },
          { label: "Large", value: "large" },
        ],
      },
      {
        key: "activeColor",
        label: "Active Color",
        type: "color",
        default: "#409eff",
      },
      {
        key: "approvedColor",
        label: "Approved Color",
        type: "color",
        default: "#67c23a",
      },
      {
        key: "rejectedColor",
        label: "Rejected Color",
        type: "color",
        default: "#f56c6c",
      },
    ],
  },
};
