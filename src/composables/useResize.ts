import { ref } from "vue";
import { useWidgetStore } from "../stores/widget";
import { useEditorStore } from "../stores/editor";
import { useBoardStore } from "../stores/board";
import { scaleDelta } from "../utils/coordinate";
import { getGridParams, snapToGrid } from "../utils/gridSnap";

/** 缩放手柄方向 */
export type ResizeHandle = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";

/**
 * 将单轴尺寸按单位换算为像素。
 *
 * @param value - position 上的数Value
 * @param unit - px or %
 * @param canvasSize - 画布对应轴像素尺寸
 */
function toPx(value: number, unit: "px" | "%", canvasSize: number): number {
  return unit === "%" ? (canvasSize * value) / 100 : value;
}

/**
 * 将像素尺寸写回 position 单位。
 *
 * @param px - 像素Value
 * @param unit - 目标单位
 * @param canvasSize - 画布对应轴像素尺寸
 */
function fromPx(px: number, unit: "px" | "%", canvasSize: number): number {
  return unit === "%" ? (px / canvasSize) * 100 : px;
}

/**
 * useResize — Component缩放逻辑
 *
 * 处理八向缩放手柄的拖拽, 维护缩放Status, Action结束后推入历史。
 * 支持 px 和 % 两种单位（宽高可独立）, 支持等比缩放（Shift 键）。
 */
export function useResize() {
  const widgetStore = useWidgetStore();
  const editorStore = useEditorStore();
  const boardStore = useBoardStore();

  const isResizing = ref(false);
  const resizeWidgetId = ref<string | null>(null);
  const resizeHandle = ref<ResizeHandle | null>(null);
  const startX = ref(0);
  const startY = ref(0);
  const startW = ref(0);
  const startH = ref(0);
  const startWUnit = ref<"px" | "%">("px");
  const startHUnit = ref<"px" | "%">("px");
  const aspectRatio = ref(1); // Aspect ratio (pixels), used for proportional scaling

  /** 开始缩放 */
  function startResize(
    widgetId: string,
    handle: ResizeHandle,
    clientX: number,
    clientY: number,
  ) {
    const widget = widgetStore.findWidget(widgetId);
    if (!widget?.position) return;
    if (widget.locked) return;

    isResizing.value = true;
    resizeWidgetId.value = widgetId;
    resizeHandle.value = handle;
    startX.value = clientX;
    startY.value = clientY;
    startW.value = widget.position.w;
    startH.value = widget.position.h;
    startWUnit.value = widget.position.wUnit ?? "px";
    startHUnit.value = widget.position.hUnit ?? "px";

    const canvasW = boardStore.getCanvasWidthPx();
    const canvasH = boardStore.getCanvasHeightPx();
    const pxW = toPx(widget.position.w, startWUnit.value, canvasW);
    const pxH = toPx(widget.position.h, startHUnit.value, canvasH);
    aspectRatio.value = pxH > 0 ? pxW / pxH : 1;
  }

  /** Update缩放（mousemove Hrs调用） */
  function updateResize(clientX: number, clientY: number, shiftKey = false) {
    if (!isResizing.value || !resizeWidgetId.value || !resizeHandle.value)
      return;

    const zoom = boardStore.canvas.zoom;
    const { dx, dy } = scaleDelta(
      clientX - startX.value,
      clientY - startY.value,
      zoom,
    );

    const widget = widgetStore.findWidget(resizeWidgetId.value);
    if (!widget?.position) return;

    const canvasW = boardStore.getCanvasWidthPx();
    const canvasH = boardStore.getCanvasHeightPx();
    const handle = resizeHandle.value;
    const wUnit = startWUnit.value;
    const hUnit = startHUnit.value;

    let targetPxW = toPx(startW.value, wUnit, canvasW);
    let targetPxH = toPx(startH.value, hUnit, canvasH);

    if (handle.includes("e")) targetPxW = Math.max(20, targetPxW + dx);
    if (handle.includes("w")) targetPxW = Math.max(20, targetPxW - dx);
    if (handle.includes("s")) targetPxH = Math.max(20, targetPxH + dy);
    if (handle.includes("n")) targetPxH = Math.max(20, targetPxH - dy);

    // 等比缩放（Shift 键）：按像素宽高比Linkage
    if (shiftKey) {
      if (handle.includes("e") || handle.includes("w")) {
        targetPxH = targetPxW / aspectRatio.value;
      } else if (handle.includes("n") || handle.includes("s")) {
        targetPxW = targetPxH * aspectRatio.value;
      } else {
        targetPxH = targetPxW / aspectRatio.value;
      }
    }

    // 限制不超出画布边界
    const maxPxW = canvasW - (widget.position.x ?? 0);
    const maxPxH = canvasH - (widget.position.y ?? 0);
    targetPxW = Math.min(Math.max(20, targetPxW), maxPxW);
    targetPxH = Math.min(Math.max(20, targetPxH), maxPxH);

    // 网格吸附（仅像素单位轴）
    const grid = getGridParams(boardStore.canvas.freeLayout, canvasW);
    if (grid.enabled) {
      if (wUnit !== "%") {
        targetPxW = snapToGrid(targetPxW, grid.gridW, true);
      }
      if (hUnit !== "%") {
        targetPxH = snapToGrid(targetPxH, grid.gridH, true);
      }
    }

    const newW = fromPx(targetPxW, wUnit, canvasW);
    const newH = fromPx(targetPxH, hUnit, canvasH);

    // 百Min比轴MinValue：至少约 20px
    const minW = wUnit === "%" ? (20 / canvasW) * 100 : 20;
    const minH = hUnit === "%" ? (20 / canvasH) * 100 : 20;

    widgetStore.resizeWidget(
      resizeWidgetId.value,
      Math.max(minW, newW),
      Math.max(minH, newH),
    );
  }

  /** 结束缩放, 推入历史 */
  function endResize() {
    if (isResizing.value && resizeWidgetId.value) {
      editorStore.pushHistory([...widgetStore.widgets]);
    }
    isResizing.value = false;
    resizeWidgetId.value = null;
    resizeHandle.value = null;
  }

  return {
    isResizing,
    startResize,
    updateResize,
    endResize,
  };
}
