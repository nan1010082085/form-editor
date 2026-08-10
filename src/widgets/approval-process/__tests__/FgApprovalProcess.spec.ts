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
import FgApprovalProcess from "../FgApprovalProcess.vue";
import { approvalProcessConfig } from "../config";

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

describe("FgApprovalProcess", () => {
  let store: ReturnType<typeof useWidgetStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    registerAllWidgets();
    store = useWidgetStore();
  });

  function mountWidget(overrides: Record<string, unknown> = {}) {
    const widget = createWidget("approval-process", "test_approval")!;
    Object.assign(widget, overrides);
    store.addWidget(widget);
    return mount(FgApprovalProcess, {
      global: {
        plugins: [ElementPlus],
        provide: {
          [widgetDataKey as symbol]: computed(
            () => store.findWidget("test_approval")!,
          ),
        },
      },
    });
  }

  // Store CRUD
  describe("store CRUD", () => {
    it("creates widget in store", () => {
      const widget = createWidget("approval-process", "test_a");
      store.addWidget(widget!);
      expect(store.findWidget("test_a")).toBeDefined();
    });

    it("removes widget from store", () => {
      const widget = createWidget("approval-process", "test_a")!;
      store.addWidget(widget);
      store.removeWidget("test_a");
      expect(store.findWidget("test_a")).toBeNull();
    });
  });

  // Display
  describe("display", () => {
    it("renders component without errors", () => {
      const wrapper = mountWidget();
      expect(wrapper.find(".fg-approval-process").exists()).toBe(true);
    });

    it("renders nodes", () => {
      const wrapper = mountWidget();
      const nodes = wrapper.findAll(".fg-approval-process__node");
      expect(nodes.length).toBeGreaterThan(0);
    });
  });

  // Config
  describe("config", () => {
    it("declares events panel", () => {
      expect(approvalProcessConfig.configPanels).toContain("events");
    });

    it("has exposed values", () => {
      expect(approvalProcessConfig.exposedValues).toBeDefined();
      expect(approvalProcessConfig.exposedValues!.length).toBeGreaterThan(0);
    });

    it("has correct type", () => {
      expect(approvalProcessConfig.name).toBe("FgApprovalProcess");
    });

    it("has default props", () => {
      expect(approvalProcessConfig.defaultProps).toBeDefined();
      expect(approvalProcessConfig.defaultProps!.orientation).toBe("horizontal");
    });
  });

  // Registry
  describe("registry", () => {
    it("is registered after registerAllWidgets", () => {
      const widget = createWidget("approval-process", "test_registry");
      expect(widget).toBeDefined();
      expect(widget!.type).toBe("approval-process");
    });
  });
});
