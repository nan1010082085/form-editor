import { computed } from "vue";
import {
  getWidgetsByGroup,
  type WidgetRegistryItem,
} from "../widgets/registry";

export interface WidgetPanelGroup {
  label: string;
  key: WidgetRegistryItem["group"];
  items: WidgetRegistryItem[];
}

/** Component面板Group（顺序即展示顺序） */
export function useWidgetPanel() {
  const groups = computed<WidgetPanelGroup[]>(() =>
    [
      {
        label: "LayoutWidget",
        key: "layout" as const,
        items: getWidgetsByGroup("layout"),
      },
      {
        label: "ContainerWidget",
        key: "container" as const,
        items: getWidgetsByGroup("container"),
      },
      {
        label: "FormWidget",
        key: "form" as const,
        items: getWidgetsByGroup("form"),
      },
      {
        label: "Table Widget",
        key: "table" as const,
        items: getWidgetsByGroup("table"),
      },
      {
        label: "ChartWidget",
        key: "chart" as const,
        items: getWidgetsByGroup("chart"),
      },
      {
        label: "Display Widget",
        key: "static" as const,
        items: getWidgetsByGroup("static"),
      },
      {
        label: "ActionWidget",
        key: "action" as const,
        items: getWidgetsByGroup("action"),
      },
      {
        label: "Business Widget",
        key: "business" as const,
        items: getWidgetsByGroup("business"),
      },
    ].filter((g) => g.items.length > 0),
  );

  return { groups };
}
