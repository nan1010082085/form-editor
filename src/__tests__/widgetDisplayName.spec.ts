/**
 * @vitest-environment node
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  registerWidget,
  getWidgetDisplayName,
  getWidgetDescription,
} from "@/widgets/registry";
import type { WidgetRegistryItem } from "@/widgets/registry";

function mockT(messages: Record<string, string>) {
  return (key: string) => messages[key] ?? key;
}

const baseItem = {
  name: "FgBarChart",
  displayName: "Bar Chart",
  type: "bar-chart",
  group: "chart",
  component: {} as WidgetRegistryItem["component"],
  create: () => ({ id: "x", type: "bar-chart" }),
  config: { description: "EN description" },
} as unknown as WidgetRegistryItem;

describe("getWidgetDisplayName i18n key resolution", () => {
  beforeEach(() => {
    registerWidget(baseItem);
  });

  it("resolves camelCase locale key for kebab SchemaType", () => {
    const t = mockT({
      "editor.widgets.barChart.displayName": "柱状图",
    });
    expect(getWidgetDisplayName("bar-chart", t)).toBe("柱状图");
  });

  it("prefers kebab locale key over camelCase", () => {
    const t = mockT({
      "editor.widgets.bar-chart.displayName": "柱状图(kebab)",
      "editor.widgets.barChart.displayName": "柱状图(camel)",
    });
    expect(getWidgetDisplayName("bar-chart", t)).toBe("柱状图(kebab)");
  });

  it("falls back to config.displayName when locale missing", () => {
    const t = mockT({});
    expect(getWidgetDisplayName("bar-chart", t)).toBe("Bar Chart");
  });

  it("resolves description with camelCase alias", () => {
    const t = mockT({
      "editor.widgets.barChart.description": "柱状图描述",
    });
    expect(getWidgetDescription("bar-chart", t)).toBe("柱状图描述");
  });
});
