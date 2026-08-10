import type { WidgetConfig, Widget, EventTargetConfig } from "../base/types";
export interface ToolbarButtonItem {
  text: string;
  type?: "primary" | "success" | "warning" | "danger" | "info" | "";
  icon?: string;
}

export const toolbarButtonsConfig: WidgetConfig = {
  name: "FgToolbarButtons",
  displayName: "Toolbar Buttons",
  description: "Toolbar button group for action bar",
  author: "yangdongnan",
  defaultStyle: {
    width: "100%",
    fontSize: "14px",
  },
  defaultProps: {
    buttons: [
      { text: "Query", type: "primary" },
      { text: "Reset", type: "" },
    ] as ToolbarButtonItem[],
    disabled: false,
  },
  configPanels: ["events"],
  eventTargets: (widget: Widget): EventTargetConfig[] => {
    const btns = (widget.props?.buttons as ToolbarButtonItem[]) || [];
    return btns.map((btn, idx) => ({
      id: `btn-${idx}`,
      label: btn.text || `Button ${idx + 1}`,
    }));
  },
  propertyPanel: {
    basic: ["field", "label"],
    style: ["fontSize", "color", "backgroundColor"],
    props: [
      {
        key: "buttons",
        label: "Button List",
        type: "array-editor",
        default: [],
        fields: [
          { key: "text", label: "Text", type: "text", placeholder: "Button Text" },
          {
            key: "type",
            label: "Type",
            type: "select",
            options: [
              { label: "Default", value: "" },
              { label: "Primary", value: "primary" },
              { label: "Success", value: "success" },
              { label: "Warning", value: "warning" },
              { label: "Danger", value: "danger" },
              { label: "Info", value: "info" },
            ],
            default: "",
          },
        ],
      },
      { key: "disabled", label: "Disabled", type: "switch", default: false },
    ],
  },
};
