/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { nextTick, computed, defineComponent, h, provide } from "vue";
import ElementPlus from "element-plus";
import editorZhCN from "@/locales/editor-zh-CN";
import { registerAllWidgets } from "@/widgets";
import { createWidget, getComponentMap } from "@/widgets/registry";
import { widgetDataKey } from "@/widgets/base/types";
import FgRowContainer from "@/widgets/row-container/FgRowContainer.vue";
import WidgetNode from "@/components/WidgetRenderer/WidgetNode.vue";
import WidgetRenderer from "@/components/WidgetRenderer/index.vue";

const messages = editorZhCN as unknown as Record<string, unknown>;
function lookup(obj: Record<string, unknown>, path: string): string {
  const parts = path.split(".");
  let cur: unknown = obj;
  for (const p of parts) {
    cur = (cur as Record<string, unknown>)?.[p];
  }
  return typeof cur === "string" ? cur : path;
}

vi.mock("@/composables/useLogger", () => ({
  useLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    event: vi.fn(),
    rule: vi.fn(),
    api: vi.fn(),
    lifecycle: vi.fn(),
    child: vi.fn(),
  }),
}));

vi.mock("@schema-platform/platform-shared", async (importOriginal) => {
  const actual = await importOriginal() as Record<string, unknown>;
  return { ...actual, useI18n: () => ({ t: (key: string) => lookup(messages, key) }), reportError: vi.fn() };
});

vi.mock("@/api/telemetryApi", () => ({
  reportTelemetryError: vi.fn(),
  reportTelemetry: vi.fn(),
  reportTelemetryBatch: vi.fn(),
  fetchEditorTelemetrySummary: vi.fn(),
}));

describe("row-container grid render", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    registerAllWidgets();
  });

  it("component map includes row-container", () => {
    const map = getComponentMap();
    expect(map["row-container"]).toBeTruthy();
  });

  it("FgRowContainer mounts with provide", async () => {
    const widget = createWidget("row-container", "rc1")!;
    const Host = defineComponent({
      setup() {
        provide(widgetDataKey, computed(() => widget));
        return () => h(FgRowContainer, { editorSelectable: true });
      },
    });
    const wrapper = mount(Host, {
      global: { plugins: [ElementPlus] },
    });
    await flushPromises();
    expect(wrapper.text()).toContain("拖入部件到行");
    wrapper.unmount();
  });

  it("WidgetNode does not show error boundary for empty row-container", async () => {
    const widget = createWidget("row-container", "rc2")!;
    const errors: unknown[] = [];
    const wrapper = mount(WidgetNode, {
      props: { widget, editorSelectable: true },
      global: {
        plugins: [ElementPlus],
        config: {
          errorHandler(err) {
            errors.push(err);
          },
        },
        stubs: {
          AppIcon: { template: "<span />", props: ["name", "size"] },
        },
      },
    });
    await flushPromises();
    await nextTick();
    expect(errors).toEqual([]);
    expect(wrapper.html()).not.toContain("renderError");
    expect(wrapper.html()).not.toContain("组件渲染异常");
    expect(wrapper.text()).toContain("拖入部件到行");
    wrapper.unmount();
  });

  it("WidgetRenderer flow layout renders row-container", async () => {
    const widget = createWidget("row-container", "rc3")!;
    // simulate grid adapter
    widget.gridSpan = -1;
    widget.style = { ...(widget.style ?? {}), width: "100%" };

    const errors: unknown[] = [];
    const wrapper = mount(WidgetRenderer, {
      props: {
        schema: [widget],
        layout: "flow",
        canvasConfig: {
          layoutMode: "grid",
          width: 1200,
          height: 800,
          gridLayout: { minWidth: 100, columnGap: 8, rowGap: 12 },
        },
        editorSelectable: true,
      },
      global: {
        plugins: [ElementPlus],
        config: {
          errorHandler(err) {
            errors.push(err);
            console.error("ERR", err);
          },
        },
        stubs: {
          AppIcon: { template: "<span />", props: ["name", "size"] },
        },
      },
      attachTo: document.body,
    });
    await flushPromises();
    await nextTick();
    // give ResizeObserver a tick
    await new Promise((r) => setTimeout(r, 30));

    expect(errors).toEqual([]);
    expect(wrapper.html()).not.toContain("renderError");
    expect(wrapper.html()).not.toContain("组件渲染异常");
    wrapper.unmount();
  });

  it("WidgetRenderer renders row-container with a child select", async () => {
    const row = createWidget("row-container", "rc4")!;
    const select = createWidget("select", "sel1")!;
    select.span = 24;
    select.style = { width: "100%" };
    row.children = [select];
    row.gridSpan = -1;

    const errors: unknown[] = [];
    const wrapper = mount(WidgetRenderer, {
      props: {
        schema: [row],
        layout: "flow",
        canvasConfig: { layoutMode: "grid", width: 1200, height: 800 },
        editorSelectable: true,
      },
      global: {
        plugins: [ElementPlus],
        config: {
          errorHandler(err) {
            errors.push(err);
            console.error("ERR", err);
          },
        },
        stubs: {
          AppIcon: { template: "<span />", props: ["name", "size"] },
        },
      },
      attachTo: document.body,
    });
    await flushPromises();
    await nextTick();
    await new Promise((r) => setTimeout(r, 30));

    console.log(
      "errors",
      errors.map((e) => (e instanceof Error ? e.message : String(e))),
    );
    console.log("hasBoundary", wrapper.html().includes("renderError"));

    expect(errors).toEqual([]);
    expect(wrapper.html()).not.toContain("renderError");
    wrapper.unmount();
  });
});
