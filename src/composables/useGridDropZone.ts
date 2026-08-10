import { ref, type Ref } from "vue";
import { ElMessage } from "element-plus";
import { tt } from "@/locales";
import { createWidget, generateWidgetId } from "@/widgets/registry";
import type { SchemaType, Widget } from "@/widgets/base/types";
import { useWidgetStore } from "@/stores/widget";
import { useEditorStore } from "@/stores/editor";
import {
  parseSchemaDragData,
  resolveGridInsertIndex,
  resolveSchemaDragDropEffect,
  mapFilteredIndexToFull,
  renderGridInsertIndicator,
  clearGridInsertIndicator,
} from "@/utils/gridCanvasDrop";

export function useGridDropZone(
  containerRef: Ref<HTMLElement | null>,
  parentId: () => string | null,
  siblings: () => Widget[],
  enabled: () => boolean,
  insertMeta?: () => Partial<Widget> | null,
  /**
   * 未Filter的全量子节点（用于 tabs 按 activeKey / col 按 colIndex Filter场景）。
   * 传入Hrs, 拖放落点Index会从"Filter后Column表"Map回"全量Column表", 避免多 tab / 多 col 错位。
   * 根级拖放 siblings 即全量, 无需传入。
   */
  allChildren?: () => Widget[],
) {
  const widgetStore = useWidgetStore();
  const editorStore = useEditorStore();
  const isDragOver = ref(false);
  /** 当前拖拽落点对应的插入Index（-1 表示未拖拽） */
  const insertIndex = ref(-1);

  /** 将Filter后IndexMap为全量Index（无 allChildren Hrs原样返回） */
  function resolveFullIndex(filteredIdx: number): number {
    if (!allChildren) return filteredIdx;
    return mapFilteredIndexToFull(siblings(), allChildren(), filteredIdx);
  }

  function handleDragOver(event: DragEvent) {
    if (!enabled()) return;
    const types = event.dataTransfer?.types ?? [];
    const allowed =
      types.includes("schema-type") ||
      types.includes("application/schema-drag");
    if (!allowed) return;
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer!.dropEffect = resolveSchemaDragDropEffect(types);
    isDragOver.value = true;
    // 实Hrs计算插入Index, 并渲染指示线
    const container = containerRef.value;
    if (container) {
      const idx = resolveGridInsertIndex(container, event.clientY, siblings());
      insertIndex.value = idx;
      renderGridInsertIndicator(container, siblings(), idx);
    }
  }

  function handleDragLeave(event: DragEvent) {
    if (!enabled()) return;
    const related = event.relatedTarget as HTMLElement | null;
    const container = containerRef.value;
    if (related && container?.contains(related)) return;
    isDragOver.value = false;
    insertIndex.value = -1;
    if (container) clearGridInsertIndicator(container);
  }

  function handleDrop(event: DragEvent) {
    if (!enabled()) return;
    event.preventDefault();
    event.stopPropagation();
    isDragOver.value = false;
    insertIndex.value = -1;

    const container = containerRef.value;
    if (!container) return;
    clearGridInsertIndicator(container);

    const payload = parseSchemaDragData(event);
    if (!payload) return;

    const filteredIdx = resolveGridInsertIndex(
      container,
      event.clientY,
      siblings(),
    );
    const insertIndexValue = resolveFullIndex(filteredIdx);
    const pid = parentId();
    const meta = insertMeta?.() ?? undefined;

    if (payload.source === "canvas" && payload.id) {
      widgetStore.moveWidgetToIndex(payload.id, pid, insertIndexValue, meta);
      editorStore.select(payload.id);
      editorStore.pushHistory([...widgetStore.widgets]);
      return;
    }

    const schemaType = payload.type as SchemaType | undefined;
    if (!schemaType) return;

    const widget = createWidget(schemaType, generateWidgetId(schemaType));
    if (!widget) {
      ElMessage.error(tt("editor.canvas.unknownWidgetType", { type: schemaType }));
      return;
    }

    widgetStore.insertWidgetAt(pid, widget, insertIndexValue, meta);
    editorStore.select(widget.id);
    editorStore.pushHistory([...widgetStore.widgets]);
  }

  return {
    isDragOver,
    insertIndex,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  };
}
