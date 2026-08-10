import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { mount } from "@vue/test-utils";
import { computed } from "vue";
import ElementPlus from "element-plus";
import editorZhCN from "@/locales/editor-zh-CN";
import { useWidgetStore } from "@/stores/widget";
import { registerAllWidgets } from "@/widgets/index";
import { createWidget } from "@/widgets/registry";
import { widgetDataKey } from "../../base/types";
import FgCountDown from "../FgCountDown.vue";
import { countDownConfig } from "../config";

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

describe("FgCountDown", () => {
  let store: ReturnType<typeof useWidgetStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    registerAllWidgets();
    store = useWidgetStore();
  });

  function mountWidget(overrides: Record<string, unknown> = {}) {
    const widget = createWidget("count-down", "test_countdown")!;
    Object.assign(widget, overrides);
    store.addWidget(widget);
    return mount(FgCountDown, {
      global: {
        plugins: [ElementPlus],
        provide: {
          [widgetDataKey as symbol]: computed(
            () => store.findWidget("test_countdown")!,
          ),
        },
      },
    });
  }

  // Store CRUD
  describe("store CRUD", () => {
    it("creates widget in store", () => {
      const widget = createWidget("count-down", "test_cd");
      store.addWidget(widget!);
      expect(store.findWidget("test_cd")).toBeDefined();
    });

    it("removes widget from store", () => {
      const widget = createWidget("count-down", "test_cd")!;
      store.addWidget(widget);
      store.removeWidget("test_cd");
      expect(store.findWidget("test_cd")).toBeNull();
    });
  });

  // Display
  describe("display", () => {
    it("shows countdown with default duration (3600s)", () => {
      const wrapper = mountWidget();
      // Should show some digits (the default duration is 3600s)
      const text = wrapper.text();
      expect(text).toMatch(/\d/);
    });

    it("renders component without errors", () => {
      const wrapper = mountWidget();
      expect(wrapper.find(".fg-count-down").exists()).toBe(true);
    });
  });

  // Config
  describe("config", () => {
    it("declares events panel", () => {
      expect(countDownConfig.configPanels).toContain("events");
    });

    it("declares variables panel", () => {
      expect(countDownConfig.configPanels).toContain("variables");
    });

    it("has exposed values", () => {
      expect(countDownConfig.exposedValues).toBeDefined();
      expect(countDownConfig.exposedValues!.length).toBeGreaterThan(0);
    });

    it("has correct type", () => {
      expect(countDownConfig.name).toBe("FgCountDown");
    });

    it("has default props", () => {
      expect(countDownConfig.defaultProps).toBeDefined();
      expect(countDownConfig.defaultProps!.duration).toBe(3600);
    });
  });

  // Registry
  describe("registry", () => {
    it("is registered after registerAllWidgets", () => {
      // registerAllWidgets is called in beforeEach, so count-down should be registered
      // We can verify by checking if createWidget returns a valid widget
      const widget = createWidget("count-down", "test_registry");
      expect(widget).toBeDefined();
      expect(widget!.type).toBe("count-down");
    });
  });
});
