/**
 * useChartEvents — 图表事件绑定 composable
 *
 * 将 ECharts 交互事件（click 等）转发到事件引擎，
 * 支持图表间联动（钻取、筛选、高亮）。
 */
import { inject, watch, onUnmounted, type Ref } from 'vue'
import { EVENT_CONTEXT_KEY } from '../components/WidgetRenderer/types'
import { triggerWidgetEvent } from '../engine/eventEngine'
import type { Widget } from '../widgets/base/types'
import type { EChartsType } from '../widgets/base/echarts'
import type { EventExecutionContext } from '../engine/eventEngine'

export interface ChartClickPayload {
  dataIndex: number
  name: string
  value: unknown
  seriesName: string
  data: Record<string, unknown>
}

/**
 * 绑定 ECharts 事件到事件引擎
 * @param chartInstance - ECharts 实例
 * @param widgetData - 当前 widget 数据
 * @param chartData - 图表原始数据（用于取 dataIndex 对应的行）
 */
export function useChartEvents(
  chartInstance: Ref<EChartsType | null>,
  widgetData: Ref<Widget>,
  chartData: Ref<Record<string, unknown>[]>,
): void {
  const eventCtx = inject<EventExecutionContext | null>(EVENT_CONTEXT_KEY, null)
  if (!eventCtx) return

  function bindEvents(instance: EChartsType) {
    // 移除旧监听避免重复绑定
    instance.off('click')
    instance.on('click', (params: Record<string, unknown>) => {
      const payload: ChartClickPayload = {
        dataIndex: (params.dataIndex as number) ?? 0,
        name: (params.name as string) ?? '',
        value: params.value,
        seriesName: (params.seriesName as string) ?? '',
        data: chartData.value[(params.dataIndex as number) ?? 0] ?? {},
      }

      const ctxWithChart: EventExecutionContext = {
        ...eventCtx,
        chartEvent: payload,
      }

      triggerWidgetEvent(widgetData.value, 'chart-click', ctxWithChart, 'chart-click')
    })
  }

  // 监听实例创建（懒加载场景下实例可能延迟出现）
  watch(chartInstance, (inst) => {
    if (inst) bindEvents(inst)
  }, { immediate: true })

  onUnmounted(() => {
    chartInstance.value?.off('click')
  })
}
