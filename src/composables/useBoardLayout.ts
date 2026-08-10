/**
 * useBoardLayout — 画布Layout模式 derived state
 */
import { computed, type ComputedRef } from "vue";
import type { CanvasConfig } from "@/widgets/base/types";
import {
  buildContentFrameStyle,
  resolveRendererLayout,
} from "@/utils/boardTemplates";

export function useBoardLayout(
  canvas: ComputedRef<CanvasConfig> | (() => CanvasConfig),
) {
  const canvasRef = typeof canvas === "function" ? computed(canvas) : canvas;

  const layoutMode = computed(() => canvasRef.value.layoutMode ?? "free");
  const isGridLayout = computed(() => layoutMode.value === "grid");
  const isFreeLayout = computed(() => layoutMode.value === "free");
  const rendererLayout = computed(() => resolveRendererLayout(canvasRef.value));
  const contentFrameStyle = computed(() =>
    buildContentFrameStyle(canvasRef.value),
  );

  return {
    layoutMode,
    isGridLayout,
    isFreeLayout,
    rendererLayout,
    contentFrameStyle,
  };
}
