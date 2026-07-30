import type { WidgetConfig } from "../base/types";

export const permissionTreeConfig: WidgetConfig = {
  name: "FgPermissionTree",
  displayName: "Permission Tree",
  description: "Permission tree selector",
  author: "yangdongnan",
  defaultStyle: {
    width: "100%",
    height: "400px",
  },
  defaultProps: {
    data: [],
    showCheckbox: true,
    checkStrictly: false,
    defaultExpandAll: true,
    nodeKey: "id",
    props: { children: "children", label: "label" },
  },
  exposedValues: [
    {
      key: "checkedKeys",
      type: "array",
      description: "Checked Node Keys",
      example: [],
    },
  ],
  configPanels: ["events", "variables"],
  propertyPanel: {
    basic: ["field", "label"],
    style: ["fontSize", "color", "backgroundColor"],
    props: [
      {
        key: "showCheckbox",
        label: "Show Checkbox",
        type: "switch",
        default: true,
      },
      {
        key: "checkStrictly",
        label: "Check Independently",
        type: "switch",
        default: false,
      },
      {
        key: "defaultExpandAll",
        label: "Expand All",
        type: "switch",
        default: true,
      },
    ],
  },
};
