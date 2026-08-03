/**
 * useSchemaLoader - 将 SchemaDetail 加载进三大 Store 的统一入口
 *
 * 收口三处原本各自内联的加载逻辑（EditorView 进入编辑 / Toolbar 加载版本 /
 * SchemaVersionCompare 回滚），统一为：
 *   parseSchemaJson -> boardStore.loadBoard -> widgetStore.loadWidgets(layoutMode) -> editorStore.resetHistory
 *
 * 关键：必须用 resetHistory 而非 markClean。加载新文档/历史版本意味着撤销基线重置，
 * 否则 undo 会把 widgets 回退到加载前的旧状态（与当前文档错乱）。
 * 修复前 Toolbar/VersionCompare 用 markClean 导致加载版本后 Ctrl+Z 跳回旧文档。
 *
 * layoutMode 显式从 boardConfig.canvas 透传给 loadWidgets，避免依赖 loadBoard
 * 写入后 getBoardLayoutMode() 的隐式时序。
 */
import { useBoardStore } from "@/stores/board";
import { useWidgetStore } from "@/stores/widget";
import { useEditorStore } from "@/stores/editor";
import { parseSchemaJson } from "@/utils/parseSchemaJson";
import type { SchemaDetail } from "@/types/api";
import type { BoardVariable, BoardEvent, BoardLayoutMode } from "@/widgets/base/types";

export function useSchemaLoader() {
  const boardStore = useBoardStore();
  const widgetStore = useWidgetStore();
  const editorStore = useEditorStore();

  /**
   * 将一份 Schema 详情解析并写入 board / widget / editor 三大 Store。
   * 调用方负责后续的 UI 反馈（emit、ElMessage、currentEditId 赋值等）。
   */
  function loadSchemaDetail(detail: SchemaDetail): void {
    const { widgets, boardConfig } = parseSchemaJson(detail.json);

    // 兼容旧数据：layoutMode "flex" -> "grid"
    const rawCanvas = boardConfig.canvas as { layoutMode?: string } & typeof boardConfig.canvas;
    const rawMode = rawCanvas?.layoutMode;
    const layoutMode: BoardLayoutMode =
      rawMode === "flex" ? "grid" : (rawMode as BoardLayoutMode) ?? "free";
    const canvas = rawCanvas
      ? { ...rawCanvas, layoutMode }
      : boardConfig.canvas;

    boardStore.loadBoard({
      id: detail.id,
      name: detail.name,
      status: (detail.status as "draft" | "published") || "draft",
      canvas,
      variables: boardConfig.variables as BoardVariable[] | undefined,
      events: boardConfig.events as BoardEvent[] | undefined,
    });

    widgetStore.loadWidgets(widgets, layoutMode);
    editorStore.resetHistory(widgets);
  }

  return { loadSchemaDetail };
}
