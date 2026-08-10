/**
 * useChartEvents — ChartEvent绑定 composable
 *
 * 将 ECharts 交互Event（click 等）转发到Event引擎, 
 * 支持Chart间Linkage（钻取、Filter、高亮）。
 */
import { inject, watch, onUnmounted, type Ref } from "vue";
import { EVENT_CONTEXT_KEY } from "../components/WidgetRenderer/types";
import { triggerWidgetEvent } from "../engine/eventEngine";
import type { Widget } from "../widgets/base/types";
import type { EChartsType } from "../widgets/base/echarts";
import type { EventExecutionContext } from "../engine/eventEngine";

export interface ChartClickPayload {
  dataIndex: number;
  name: string;
  value: unknown;
  seriesName: string;
  data: Record<string, unknown>;
}

/**
 * 绑定 ECharts Event到Event引擎
 * @param chartInstance - ECharts 实例（Ref<unknown> 以兼容 echarts.init 返回的完整 ECharts Type与 EChartsType 的偏差）
 * @param widgetData - 当前 widget Data
 * @param chartData - Chart原始Data（用于取 dataIndex 对应的Row）
 */
export function useChartEvents(
  chartInstance: Ref<unknown>,
  widgetData: Ref<Widget>,
  chartData: Ref<Record<string, unknown>[]>,
): void {
  const eventCtx = inject<EventExecutionContext | null>(
    EVENT_CONTEXT_KEY,
    null,
  );
  if (!eventCtx) return;

  function bindEvents(instance: EChartsType) {
    // 移除旧监听避免重复绑定
    instance.off("click");
    instance.on("click", (params: Record<string, unknown>) => {
      const payload: ChartClickPayload = {
        dataIndex: (params.dataIndex as number) ?? 0,
        name: (params.name as string) ?? "",
        value: params.value,
        seriesName: (params.seriesName as string) ?? "",
        data: chartData.value[(params.dataIndex as number) ?? 0] ?? {},
      };

      const ctxWithChart = {
        ...eventCtx,
        chartEvent: payload,
      } as EventExecutionContext;

      triggerWidgetEvent(
        widgetData.value,
        "chart-click",
        ctxWithChart,
        "chart-click",
      );
    });
  }

  // 监听实例创建（懒加载场景下实例可能延迟出现）
  watch(
    chartInstance,
    (inst) => {
      if (inst) bindEvents(inst as EChartsType);
    },
    { immediate: true },
  );

  onUnmounted(() => {
    (chartInstance.value as EChartsType | null)?.off("click");
  });
}
