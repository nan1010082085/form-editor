/**
 * useGridEngine - Vue composable 封装 gridEngine
 *
 * 用 ResizeObserver 跟踪容器宽度，用 Vue computed 响应式计算
 * templateColumns / gap / 每个子节点的 gridColumn。
 *
 * 用法：
 * ```ts
 * const { containerRef, templateColumns, gap, getChildStyle } = useGridEngine(
 *   () => boardStore.canvas.gridLayout,
 *   () => widgetStore.widgets,
 * );
 * // 容器: <div ref="containerRef" :style="{ gridTemplateColumns, gap }">
 * // 子节点: :style="getChildStyle(widget)"
 * ```
 */
import { ref, computed, watch, type Ref } from "vue";
import {
  computeGridLayout,
  resolveGridOptions,
  type GridChild,
  type GridOptions,
} from "@/utils/gridEngine";
import type { Widget, GridLayoutOptions } from "@/widgets/base/types";

export function useGridEngine(
  options: () => GridLayoutOptions | undefined,
  widgets: () => Widget[],
) {
  const containerWidth = ref(0);
  const containerRef: Ref<HTMLElement | null> = ref(null);

  let resizeObserver: ResizeObserver | null = null;

  function connect(el: HTMLElement | null) {
    disconnect();
    containerRef.value = el;
    if (!el) return;
    const measure = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width) containerWidth.value = rect.width;
    };
    measure();
    resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(el);
  }

  function disconnect() {
    if (resizeObserver) {
      resizeObserver.disconnect();
      resizeObserver = null;
    }
  }

  const children: Ref<GridChild[]> = computed(() =>
    widgets().map((w) => ({
      originSpan: w.gridSpan ?? 1,
      visible: !w.hidden,
    })),
  );

  const layout = computed(() =>
    computeGridLayout(containerWidth.value, children.value, options()),
  );

  const templateColumns = computed(() => layout.value.templateColumns);
  const gap = computed(() => layout.value.gap);
  const columns = computed(() => layout.value.columns);

  /** 获取子节点的 grid-column 样式 */
  function getChildGridColumn(index: number): string {
    return layout.value.children[index]?.gridColumn ?? "span 1 / auto";
  }

  /** 获取子节点的 grid-column 样式（按 widget 引用查找） */
  function getChildStyle(widget: Widget, index: number): Record<string, string> {
    const gridColumn = getChildGridColumn(index);
    return gridColumn ? { gridColumn } : {};
  }

  return {
    containerRef,
    connect,
    disconnect,
    templateColumns,
    gap,
    columns,
    getChildGridColumn,
    getChildStyle,
  };
}
