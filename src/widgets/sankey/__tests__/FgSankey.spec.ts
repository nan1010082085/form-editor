import { describe, it, expect, beforeEach, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { mount } from "@vue/test-utils";
import { computed } from "vue";
import ElementPlus from "element-plus";
import editorZhCN from "@/locales/editor-zh-CN";
import { useWidgetStore } from "@/stores/widget";
import { registerAllWidgets } from "@/widgets/index";
import { createWidget } from "@/widgets/registry";
import { widgetDataKey } from "../../base/types";
import FgSankey from "../FgSankey.vue";
import { sankeyConfig } from "../config";

const messages = editorZhCN as unknown as Record<string, unknown>;
function lookup(obj: Record<string, unknown>, path: string): string {
  const parts = path.split(".");
  let cur: unknown = obj;
  for (const p of parts) {
    cur = (cur as Record<string, unknown>)?.[p];
  }
  return typeof cur === "string" ? cur : path;
}

vi.mock("@schema-platform/platform-shared", async (importOriginal) => {
  const actual = await importOriginal() as Record<string, unknown>;
  return { ...actual, useI18n: () => ({ t: (key: string) => lookup(messages, key) }) };
});

// Mock echarts to avoid DOM issues in tests
vi.mock("../../base/echarts", () => ({
  echarts: {
    init: vi.fn(() => ({
      setOption: vi.fn(),
      resize: vi.fn(),
      dispose: vi.fn(),
    })),
    dispose: vi.fn(),
  },
}));

describe("FgSankey", () => {
  let store: ReturnType<typeof useWidgetStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    registerAllWidgets();
    store = useWidgetStore();
  });

  function mountWidget(overrides: Record<string, unknown> = {}) {
    const widget = createWidget("sankey", "test_sankey")!;
    Object.assign(widget, overrides);
    store.addWidget(widget);
    return mount(FgSankey, {
      global: {
        plugins: [ElementPlus],
        provide: {
          [widgetDataKey as symbol]: computed(
            () => store.findWidget("test_sankey")!,
          ),
        },
      },
    });
  }

  // Store CRUD
  describe("store CRUD", () => {
    it("creates widget in store", () => {
      const widget = createWidget("sankey", "test_s");
      store.addWidget(widget!);
      expect(store.findWidget("test_s")).toBeDefined();
    });

    it("removes widget from store", () => {
      const widget = createWidget("sankey", "test_s")!;
      store.addWidget(widget);
      store.removeWidget("test_s");
      expect(store.findWidget("test_s")).toBeNull();
    });
  });

  // Display
  describe("display", () => {
    it("renders component without errors", () => {
      const wrapper = mountWidget();
      expect(wrapper.find(".fg-sankey").exists()).toBe(true);
    });
  });

  // Config
  describe("config", () => {
    it("declares api panel", () => {
      expect(sankeyConfig.configPanels).toContain("api");
    });

    it("declares events panel", () => {
      expect(sankeyConfig.configPanels).toContain("events");
    });

    it("has exposed values", () => {
      expect(sankeyConfig.exposedValues).toBeDefined();
      expect(sankeyConfig.exposedValues!.length).toBeGreaterThan(0);
    });

    it("has correct type", () => {
      expect(sankeyConfig.name).toBe("FgSankey");
    });

    it("has default props", () => {
      expect(sankeyConfig.defaultProps).toBeDefined();
      expect(sankeyConfig.defaultProps!.orientation).toBe("horizontal");
    });
  });

  // Registry
  describe("registry", () => {
    it("is registered after registerAllWidgets", () => {
      const widget = createWidget("sankey", "test_registry");
      expect(widget).toBeDefined();
      expect(widget!.type).toBe("sankey");
    });
  });
});
