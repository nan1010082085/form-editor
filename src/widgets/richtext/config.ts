import type { WidgetConfig } from "../base/types";

export const richtextConfig: WidgetConfig = {
  name: "FgRichtext",
  displayName: "Rich Text",
  description:
    "Multi-line rich text (plain mode)",
  author: "yangdongnan",
  defaultStyle: {
    width: "100%",
    height: "200px",
  },
  defaultProps: {
    placeholder: "Please enter content",
    readonly: false,
  },
  exposedValues: [
    { key: "value", type: "string", description: "Current field value", example: "" },
  ],
  configPanels: ["events", "linkages", "variables"] as const,
  propertyPanel: {
    basic: ["field", "label", "defaultValue"],
    style: [],
    props: [
      {
        key: "placeholder",
        label: "Placeholder",
        type: "input",
        default: "Please enter content",
      },
      { key: "readonly", label: "Read Only", type: "switch", default: false },
      {
        key: "showToolbar",
        label: "Show Toolbar",
        type: "switch",
        default: true,
      },
    ],
  },
};
