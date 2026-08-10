import type { WidgetConfig } from "../base/types";

export const autocompleteConfig: WidgetConfig = {
  name: "FgAutocomplete",
  displayName: "Autocomplete",
  description: "Autocomplete with remote search",
  author: "yangdongnan",
  defaultStyle: { width: "240px", height: "40px" },
  defaultProps: {
    placeholder: "Please enter",
    clearable: true,
    disabled: false,
    debounce: 300,
    suggestions: [],
  },
  exposedValues: [
    { key: "value", type: "string", description: "Current Input", example: "" },
  ],
  configPanels: ["events", "linkages", "variables"] as const,
  propertyPanel: {
    basic: ["field", "label", "defaultValue"],
    style: ["fontSize", "color", "backgroundColor"],
    props: [
      {
        key: "placeholder",
        label: "Placeholder",
        type: "input",
        default: "Please enter",
      },
      { key: "clearable", label: "Clearable", type: "switch", default: true },
      { key: "disabled", label: "Disabled", type: "switch", default: false },
      { key: "debounce", label: "Debounce (ms)", type: "number", default: 300 },
      {
        key: "suggestions",
        label: "Suggestion List",
        type: "options",
        default: [],
        fields: [{ key: "value", label: "Value", type: "text" }],
      },
    ],
  },
};
