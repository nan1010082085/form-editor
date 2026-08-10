/**
 * useDragStore — 拖拽Status管理
 *
 * 职责：
 * - 拖拽Status（是否拖拽中、拖拽来源、拖拽目标 ID/Type）
 * - 拖拽位置（当前坐标、增量）
 * - 碰撞Status（悬停的Container ID、是否在Container内）
 * - 辅助线（对齐参考线、吸附坐标）
 * - 放置预览线（指示插入位置）
 * - 原始位置快照（Cancel拖拽HrsRestore）
 *
 * 变化频率最高, 独立管理, 与 Widget Data和Edit器Status解耦。
 */
import { defineStore } from "pinia";
import { ref } from "vue";

// ================================================================
// Type定义
// ================================================================

interface GuideLine {
  type: "horizontal" | "vertical";
  position: number;
  start: number;
  end: number;
}

/** 放置预览线 — 指示新Component将被插入的位置 */
export interface DropPreviewLine {
  /** 预览线方向 */
  orientation: "horizontal" | "vertical";
  /** 预览线位置（画布坐标） */
  position: number;
  /** 预览线起始点 */
  start: number;
  /** 预览线结束点 */
  end: number;
  /** 目标Container ID（null 表示根级） */
  targetContainerId: string | null;
}

export type { GuideLine };

export const useDragStore = defineStore("drag", () => {
  // ================================================================
  // 拖拽Status
  // ================================================================

  const isDragging = ref(false);
  const dragSource = ref<"panel" | "canvas" | null>(null);
  const dragWidgetId = ref<string | null>(null);
  const dragWidgetType = ref<string | null>(null);

  // ================================================================
  // 拖拽位置
  // ================================================================

  const dragX = ref(0);
  const dragY = ref(0);
  const dragDeltaX = ref(0);
  const dragDeltaY = ref(0);

  // 拖拽起点（用于 delta 计算, 实现实Hrs跟随）
  const initialCursorX = ref(0);
  const initialCursorY = ref(0);
  const initialWidgetX = ref(0);
  const initialWidgetY = ref(0);

  // ================================================================
  // 碰撞Status
  // ================================================================

  const hoveredContainerId = ref<string | null>(null);
  const isInContainer = ref(false);

  // ================================================================
  // 辅助线
  // ================================================================

  const guideLines = ref<GuideLine[]>([]);
  const snapX = ref<number | null>(null);
  const snapY = ref<number | null>(null);

  // ================================================================
  // 放置预览线
  // ================================================================

  const dropPreviewLine = ref<DropPreviewLine | null>(null);

  // ================================================================
  // 原始位置快照（Cancel拖拽HrsRestore）
  // ================================================================

  const originalPosition = ref<{
    x: number;
    y: number;
    parentId: string | null;
  } | null>(null);

  // ================================================================
  // 方法
  // ================================================================

  /**
   * 开始拖拽。
   *
   * @param source - 拖拽来源：'panel'（Component面板拖入）或 'canvas'（画布内拖动）
   * @param id     - 被拖拽的 Widget ID（canvas 拖动Hrs必传）
   * @param type   - ComponentType（panel 拖入Hrs必传）
   */
  function startDrag(
    source: "panel" | "canvas",
    id?: string,
    type?: string,
    opts?: {
      cursorX?: number;
      cursorY?: number;
      widgetX?: number;
      widgetY?: number;
      originalX?: number;
      originalY?: number;
      originalParentId?: string | null;
    },
  ): void {
    isDragging.value = true;
    dragSource.value = source;
    dragWidgetId.value = id ?? null;
    dragWidgetType.value = type ?? null;
    dragX.value = 0;
    dragY.value = 0;
    dragDeltaX.value = 0;
    dragDeltaY.value = 0;
    initialCursorX.value = opts?.cursorX ?? 0;
    initialCursorY.value = opts?.cursorY ?? 0;
    initialWidgetX.value = opts?.widgetX ?? 0;
    initialWidgetY.value = opts?.widgetY ?? 0;
    hoveredContainerId.value = null;
    isInContainer.value = false;
    guideLines.value = [];
    snapX.value = null;
    snapY.value = null;
    dropPreviewLine.value = null;
    originalPosition.value =
      opts?.originalX !== undefined
        ? {
            x: opts.originalX,
            y: opts.originalY!,
            parentId: opts.originalParentId ?? null,
          }
        : null;
  }

  /**
   * Update拖拽位置。
   *
   * @param x - 当前鼠标 X 坐标
   * @param y - 当前鼠标 Y 坐标
   */
  function updateDragPosition(x: number, y: number): void {
    dragDeltaX.value = x - dragX.value;
    dragDeltaY.value = y - dragY.value;
    dragX.value = x;
    dragY.value = y;
  }

  /**
   * Update碰撞Status。
   *
   * @param containerId - 鼠标悬停的Container ID, 不在Container内Hrs传 null
   */
  function updateCollision(containerId: string | null): void {
    hoveredContainerId.value = containerId;
    isInContainer.value = containerId !== null;
  }

  /**
   * Update辅助线。
   */
  function updateGuideLines(lines: GuideLine[]): void {
    guideLines.value = lines;
  }

  /**
   * Update吸附坐标。
   *
   * @param x - 吸附 X 坐标, 不吸附Hrs传 null
   * @param y - 吸附 Y 坐标, 不吸附Hrs传 null
   */
  function updateSnap(x: number | null, y: number | null): void {
    snapX.value = x;
    snapY.value = y;
  }

  /**
   * Update放置预览线。
   */
  function updateDropPreviewLine(line: DropPreviewLine | null): void {
    dropPreviewLine.value = line;
  }

  /**
   * 结束拖拽, Reset所有Status。
   */
  function endDrag(): void {
    isDragging.value = false;
    dragSource.value = null;
    dragWidgetId.value = null;
    dragWidgetType.value = null;
    dragX.value = 0;
    dragY.value = 0;
    dragDeltaX.value = 0;
    dragDeltaY.value = 0;
    initialCursorX.value = 0;
    initialCursorY.value = 0;
    initialWidgetX.value = 0;
    initialWidgetY.value = 0;
    hoveredContainerId.value = null;
    isInContainer.value = false;
    guideLines.value = [];
    snapX.value = null;
    snapY.value = null;
    dropPreviewLine.value = null;
    originalPosition.value = null;
  }

  // ================================================================
  // Export
  // ================================================================

  return {
    // 拖拽Status
    isDragging,
    dragSource,
    dragWidgetId,
    dragWidgetType,
    // 拖拽位置
    dragX,
    dragY,
    dragDeltaX,
    dragDeltaY,
    // 拖拽起点
    initialCursorX,
    initialCursorY,
    initialWidgetX,
    initialWidgetY,
    // 碰撞Status
    hoveredContainerId,
    isInContainer,
    // 辅助线
    guideLines,
    snapX,
    snapY,
    // 放置预览线
    dropPreviewLine,
    // 原始位置快照
    originalPosition,
    // 方法
    startDrag,
    updateDragPosition,
    updateCollision,
    updateGuideLines,
    updateSnap,
    updateDropPreviewLine,
    endDrag,
  };
});
