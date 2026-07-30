import type { WidgetConfig } from "../base/types";
import {
  microappDefaults,
  createMicroappPropertyItems,
} from "../base/microappConfig";

export const microAppContainerConfig: WidgetConfig = {
  name: "FgMicroAppContainer",
  displayName: "Micro App Container",
  description:
    "Dynamic sub-app loading via qiankun",
  author: "system",
  defaultStyle: {},
  defaultProps: {
    ...microappDefaults,
    height: "100%",
    variables: {},
  },
  propertyPanel: {
    basic: [
      ...createMicroappPropertyItems("true"),
      {
        key: "height",
        label: "Container Height",
        type: "input",
        default: "100%",
        placeholder: "例：400px 或 100%",
      },
    ],
    style: [],
    props: [],
  },
  configPanels: ["variables"],
  exposedValues: [
    {
      key: "containerRef",
      type: "object",
      description: "Container ref for postMessage",
    },
  ],
  eventTargets: [],
  receivableEvents: [
    { name: "message", description: "Receive Micro App Message" },
    { name: "ready", description: "Micro App Loaded" },
    { name: "error", description: "Micro App Load Failed" },
  ],
};
