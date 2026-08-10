/**
 * useGridEngine - Vue composable 封装 gridEngine
 *
 * 用 ResizeObserver 跟踪ContainerWidth, 用 Vue computed 响应式计算
 * templateColumns / gap / 每个子节点的 gridColumn。
 *
 * 用法：
 * ```ts
 * const { containerRef, templateColumns, gap, getChildStyle } = useGridEngine(
 *   () => boardStore.canvas.gridLayout,
 *   () => widgetStore.widgets,
 * );
 * // Container: <div ref="containerRef" :style="{ gridTemplateColumns, gap }">
 * // 子节点: :style="getChildStyle(widget)"
 * ```
 */
import { ref, computed, type Ref } from "vue";
import {
  computeGridLayout,
  type GridChild,
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
      // -1 = 撑满剩余Column（与Property面板 / adaptWidgetToGrid 默认一致）
      originSpan: w.gridSpan ?? -1,
      visible: !w.hidden,
    })),
  );

  const layout = computed(() =>
    computeGridLayout(containerWidth.value, children.value, options()),
  );

  const templateColumns = computed(() => layout.value.templateColumns);
  const gap = computed(() => layout.value.gap);
  const columns = computed(() => layout.value.columns);

  /** 获取子节点的 grid-column Style */
  function getChildGridColumn(index: number): string {
    return layout.value.children[index]?.gridColumn ?? "span 1 / auto";
  }

  /** 获取子节点的 grid-column Style（按 widget 引用查找） */
  function getChildStyle(_widget: Widget, index: number): Record<string, string> {
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
    containerWidth,
    getChildGridColumn,
    getChildStyle,
  };
}
