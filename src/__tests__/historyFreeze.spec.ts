/**
 * @vitest-environment jsdom
 *
 * 回归：immer pushHistory 不得冻结 live widget 树。
 * 冻结后 grid 拖入容器（row-container.children.splice）会抛
 * "Cannot add property 0, object is not extensible"，触发组件渲染异常。
 */
import { describe, it, expect, beforeEach } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { registerAllWidgets } from "@/widgets";
import { createWidget } from "@/widgets/registry";
import { useWidgetStore } from "@/stores/widget";
import { useEditorStore } from "@/stores/editor";
import { useBoardStore } from "@/stores/board";

describe("history freeze isolation", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    registerAllWidgets();
    useBoardStore().canvas.layoutMode = "grid";
  });

  it("pushHistory 后 live widgets / children 仍可扩展", () => {
    const widgetStore = useWidgetStore();
    const editorStore = useEditorStore();

    const row = createWidget("row-container", "rc_live")!;
    widgetStore.insertWidgetAt(null, row, 0);
    editorStore.pushHistory([...widgetStore.widgets]);

    const live = widgetStore.findWidget("rc_live")!;
    expect(Object.isExtensible(live)).toBe(true);
    expect(Object.isExtensible(live.children ?? [])).toBe(true);

    const select = createWidget("select", "sel_live")!;
    expect(() =>
      widgetStore.insertWidgetAt("rc_live", select, 0, { span: 24 }),
    ).not.toThrow();
    expect(live.children).toHaveLength(1);
    expect(live.children?.[0]?.type).toBe("select");
  });

  it("undo 写回 store 的快照仍可变", () => {
    const widgetStore = useWidgetStore();
    const editorStore = useEditorStore();

    const row = createWidget("row-container", "rc_undo")!;
    widgetStore.insertWidgetAt(null, row, 0);
    editorStore.resetHistory([...widgetStore.widgets]);

    const select = createWidget("select", "sel_undo")!;
    widgetStore.insertWidgetAt("rc_undo", select, 0, { span: 24 });
    editorStore.pushHistory([...widgetStore.widgets]);
    expect(widgetStore.findWidget("rc_undo")?.children).toHaveLength(1);

    editorStore.performUndo();
    const afterUndo = widgetStore.findWidget("rc_undo")!;
    expect(afterUndo.children ?? []).toHaveLength(0);
    expect(Object.isExtensible(afterUndo)).toBe(true);
    expect(Object.isExtensible(afterUndo.children ?? [])).toBe(true);

    const again = createWidget("select", "sel_undo2")!;
    expect(() =>
      widgetStore.insertWidgetAt("rc_undo", again, 0, { span: 24 }),
    ).not.toThrow();
    expect(afterUndo.children).toHaveLength(1);
  });
});
