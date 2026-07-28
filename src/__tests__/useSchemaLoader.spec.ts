/**
 * useSchemaLoader 单测
 *
 * 验证 SchemaDetail -> 三大 Store 的统一加载契约：
 * - 调用 parseSchemaJson 支持新/旧格式
 * - loadBoard 写入 canvas/variables/events
 * - loadWidgets 透传 schema 自带的 layoutMode（而非依赖隐式时序）
 * - resetHistory 以新 widgets 重置撤销基线（非 markClean）
 *
 * 回归点：修复前 Toolbar 加载版本 / VersionCompare 回滚误用 markClean，
 * 导致加载后 Ctrl+Z 回退到旧文档。
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { useSchemaLoader } from "@/composables/useSchemaLoader";
import { useBoardStore } from "@/stores/board";
import { useWidgetStore } from "@/stores/widget";
import { useEditorStore } from "@/stores/editor";
import type { SchemaDetail } from "@/types/api";

function makeDetail(overrides: Partial<SchemaDetail> = {}): SchemaDetail {
  return {
    id: "schema-001",
    editId: "edit-001",
    version: "20260101120000",
    name: "Test Schema",
    type: "form",
    status: "draft",
    json: [],
    createdAt: "2026-01-01T12:00:00Z",
    updatedAt: "2026-01-01T12:00:00Z",
    ...overrides,
  };
}

describe("useSchemaLoader", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("解析新格式 { widgets, board } 并写入三大 Store", () => {
    const { loadSchemaDetail } = useSchemaLoader();
    const boardStore = useBoardStore();
    const widgetStore = useWidgetStore();
    const editorStore = useEditorStore();

    const widgetLoadSpy = vi.spyOn(widgetStore, "loadWidgets");
    const resetHistorySpy = vi.spyOn(editorStore, "resetHistory");

    const detail = makeDetail({
      json: {
        widgets: [
          {
            id: "w1",
            type: "input",
            name: "Input-1",
            label: "A",
            position: { x: 0, y: 0, w: 200, h: 40 },
          },
        ],
        board: {
          canvas: { layoutMode: "flex", width: 1200, height: 800 },
          variables: [{ name: "v1", type: "string", default: "" }],
          events: [],
        },
      },
    });

    loadSchemaDetail(detail);

    expect(boardStore.id).toBe("schema-001");
    expect(boardStore.name).toBe("Test Schema");
    expect(boardStore.layoutMode).toBe("flex");
    expect(boardStore.variables).toHaveLength(1);
    // layoutMode 必须显式透传给 loadWidgets
    expect(widgetLoadSpy).toHaveBeenCalledWith(expect.any(Array), "flex");
    // 撤销基线必须以新 widgets 重置（非 markClean）
    expect(resetHistorySpy).toHaveBeenCalledTimes(1);
    expect(resetHistorySpy).toHaveBeenCalledWith(expect.any(Array));
  });

  it("解析旧格式（裸 Widget[]）并默认 free 布局", () => {
    const { loadSchemaDetail } = useSchemaLoader();
    const widgetStore = useWidgetStore();
    const widgetLoadSpy = vi.spyOn(widgetStore, "loadWidgets");

    const detail = makeDetail({
      json: [
        {
          id: "w1",
          type: "input",
          name: "Input-1",
          label: "A",
          position: { x: 0, y: 0, w: 200, h: 40 },
        },
      ],
    });

    loadSchemaDetail(detail);

    // 旧格式无 canvas，layoutMode 回退 free
    expect(widgetLoadSpy).toHaveBeenCalledWith(expect.any(Array), "free");
  });

  it("status 缺失时回退 draft", () => {
    const { loadSchemaDetail } = useSchemaLoader();
    const boardStore = useBoardStore();

    const detail = makeDetail({ status: undefined as unknown as "draft" });
    loadSchemaDetail(detail);

    expect(boardStore.status).toBe("draft");
  });
});
