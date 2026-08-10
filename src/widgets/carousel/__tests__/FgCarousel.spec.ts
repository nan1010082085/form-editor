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
import FgCarousel from "../FgCarousel.vue";
import { carouselConfig } from "../config";

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

describe("FgCarousel", () => {
  let store: ReturnType<typeof useWidgetStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    registerAllWidgets();
    store = useWidgetStore();
  });

  function mountWidget(overrides: Record<string, unknown> = {}) {
    const widget = createWidget("carousel", "test_carousel")!;
    Object.assign(widget, overrides);
    store.addWidget(widget);
    return mount(FgCarousel, {
      global: {
        plugins: [ElementPlus],
        provide: {
          [widgetDataKey as symbol]: computed(
            () => store.findWidget("test_carousel")!,
          ),
        },
      },
      slots: {
        page: '<div class="page-content">Page</div>',
      },
    });
  }

  // Store CRUD
  describe("store CRUD", () => {
    it("creates widget in store", () => {
      const widget = createWidget("carousel", "test_c");
      store.addWidget(widget!);
      expect(store.findWidget("test_c")).toBeDefined();
    });

    it("removes widget from store", () => {
      const widget = createWidget("carousel", "test_c")!;
      store.addWidget(widget);
      store.removeWidget("test_c");
      expect(store.findWidget("test_c")).toBeNull();
    });
  });

  // Display
  describe("display", () => {
    it("renders component without errors", () => {
      const wrapper = mountWidget();
      expect(wrapper.find(".fg-carousel").exists()).toBe(true);
    });
  });

  // Config
  describe("config", () => {
    it("declares events panel", () => {
      expect(carouselConfig.configPanels).toContain("events");
    });

    it("declares variables panel", () => {
      expect(carouselConfig.configPanels).toContain("variables");
    });

    it("has exposed values", () => {
      expect(carouselConfig.exposedValues).toBeDefined();
      expect(carouselConfig.exposedValues!.length).toBeGreaterThan(0);
    });

    it("has correct type", () => {
      expect(carouselConfig.name).toBe("FgCarousel");
    });

    it("has default props", () => {
      expect(carouselConfig.defaultProps).toBeDefined();
      expect(carouselConfig.defaultProps!.autoPlay).toBe(true);
      expect(carouselConfig.defaultProps!.interval).toBe(3000);
    });
  });

  // Registry
  describe("registry", () => {
    it("is registered after registerAllWidgets", () => {
      const widget = createWidget("carousel", "test_registry");
      expect(widget).toBeDefined();
      expect(widget!.type).toBe("carousel");
    });
  });
});
