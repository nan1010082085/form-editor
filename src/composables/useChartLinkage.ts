/**
 * useChartLinkage — 图表联动 composable
 *
 * 实现图表间钻取/筛选/高亮联动：
 * 1. 监听图表点击事件（通过事件引擎 chart-click 触发）
 * 2. 按 paramMapping 映射参数到目标图表
 * 3. 执行 filter/drilldown/highlight 动作
 * 4. 维护钻取历史栈，支持面包屑回退
 */
import { ref, computed, type Ref } from 'vue'
import type {
  Widget,
  ChartLinkageRule,
  DrilldownHistoryEntry,
  ChartLinkageAction,
} from '../widgets/base/types'
import { useLogger } from '@/composables/useLogger'

const logger = useLogger('ChartLinkage')

/** 钻取状态 */
export interface DrilldownState {
  /** 当前活跃的钻取层级（widgetId -> 历史栈） */
  history: Map<string, DrilldownHistoryEntry[]>
  /** 当前筛选条件（widgetId -> 筛选参数） */
  activeFilters: Map<string, Record<string, unknown>>
  /** 当前高亮项（widgetId -> 高亮的 dataIndex 集合） */
  highlights: Map<string, Set<number>>
}

export interface UseChartLinkageOptions {
  /** 当前画布所有 Widget 列表 */
  widgets: Ref<Widget[]>
  /** 更新 Widget 属性的回调 */
  updateWidget: (id: string, patch: Partial<Widget>) => void
  /** 获取图表数据的回调 */
  getChartData?: (widgetId: string) => Record<string, unknown>[]
}

export function useChartLinkage(options: UseChartLinkageOptions) {
  const { widgets, updateWidget, getChartData } = options

  // ---- 钻取状态 ----
  const drilldownState = ref<DrilldownState>({
    history: new Map(),
    activeFilters: new Map(),
    highlights: new Map(),
  })

  // ---- 收集所有图表联动规则 ----
  const allRules = computed<ChartLinkageRule[]>(() => {
    const rules: ChartLinkageRule[] = []
    for (const widget of widgets.value) {
      if (widget.chartLinkages?.length) {
        rules.push(...widget.chartLinkages)
      }
    }
    return rules
  })

  /**
   * 从图表点击事件数据中提取参数值
   * @param data - 图表点击的原始数据行
   * @param paramMapping - 源字段 -> 目标字段的映射
   * @returns 映射后的参数对象
   */
  function extractParams(
    data: Record<string, unknown>,
    paramMapping: Record<string, string>,
  ): Record<string, unknown> {
    const params: Record<string, unknown> = {}
    for (const [sourceField, targetField] of Object.entries(paramMapping)) {
      if (sourceField in data) {
        params[targetField] = data[sourceField]
      }
    }
    return params
  }

  /**
   * 执行筛选动作：为目标图表设置筛选条件
   */
  function applyFilter(
    targetWidgetId: string,
    filters: Record<string, unknown>,
  ) {
    const current = drilldownState.value.activeFilters.get(targetWidgetId) ?? {}
    const merged = { ...current, ...filters }
    drilldownState.value.activeFilters.set(targetWidgetId, merged)
    logger.event(`筛选: #${targetWidgetId}`, merged)
  }

  /**
   * 执行钻取动作：压入历史栈，设置筛选条件
   */
  function applyDrilldown(
    sourceWidgetId: string,
    targetWidgetId: string,
    value: string,
    field: string,
    label: string,
    filters: Record<string, unknown>,
  ) {
    // 获取或初始化历史栈
    const history = drilldownState.value.history.get(sourceWidgetId) ?? []

    // 压入当前层级
    const entry: DrilldownHistoryEntry = {
      value,
      field,
      label,
      filters,
    }
    history.push(entry)
    drilldownState.value.history.set(sourceWidgetId, [...history])

    // 同时应用筛选
    applyFilter(targetWidgetId, filters)
    logger.event(`钻取: #${sourceWidgetId} → #${targetWidgetId}`, { value, field, label })
  }

  /**
   * 执行高亮动作：标记目标图表的高亮数据项
   */
  function applyHighlight(
    targetWidgetId: string,
    dataIndices: number[],
  ) {
    drilldownState.value.highlights.set(targetWidgetId, new Set(dataIndices))
    logger.event(`高亮: #${targetWidgetId}`, dataIndices)
  }

  /**
   * 清除目标图表的所有联动状态
   */
  function clearLinkageState(targetWidgetId: string) {
    drilldownState.value.activeFilters.delete(targetWidgetId)
    drilldownState.value.highlights.delete(targetWidgetId)
  }

  /**
   * 处理图表点击事件，查找匹配的联动规则并执行
   *
   * @param sourceWidgetId - 触发点击的图表 Widget ID
   * @param chartEvent - 图表点击事件数据
   */
  function handleChartClick(
    sourceWidgetId: string,
    chartEvent: {
      dataIndex: number
      name: string
      value: unknown
      seriesName: string
      data: Record<string, unknown>
    },
  ) {
    // 查找所有以当前图表为源的 click 触发规则
    const matchingRules = allRules.value.filter(
      (rule) =>
        rule.sourceWidgetId === sourceWidgetId &&
        rule.trigger === 'click',
    )

    if (matchingRules.length === 0) return

    logger.event(`处理图表点击: #${sourceWidgetId}`, {
      name: chartEvent.name,
      dataIndex: chartEvent.dataIndex,
    })

    for (const rule of matchingRules) {
      const params = extractParams(chartEvent.data, rule.paramMapping)

      for (const targetId of rule.targetWidgetIds) {
        switch (rule.action) {
          case 'filter':
            applyFilter(targetId, params)
            break

          case 'drilldown':
            applyDrilldown(
              sourceWidgetId,
              targetId,
              String(chartEvent.name),
              rule.drilldownField ?? Object.keys(rule.paramMapping)[0] ?? '',
              rule.drilldownLabel ?? String(chartEvent.name),
              params,
            )
            break

          case 'highlight': {
            // 高亮与点击数据相同类别的所有数据项
            const chartData = getChartData?.(targetId) ?? []
            const targetField = Object.values(rule.paramMapping)[0] ?? ''
            const sourceValue = chartEvent.data[Object.keys(rule.paramMapping)[0] ?? '']
            const indices = chartData
              .map((item, idx) => item[targetField] === sourceValue ? idx : -1)
              .filter((idx) => idx >= 0)
            applyHighlight(targetId, indices)
            break
          }
        }
      }
    }
  }

  /**
   * 钻取回退：从历史栈中弹出一层
   *
   * @param sourceWidgetId - 钻取源图表 ID
   * @param level - 回退到的层级（-1 = 回退一层，0 = 回到顶层）
   */
  function drilldownBack(sourceWidgetId: string, level?: number) {
    const history = drilldownState.value.history.get(sourceWidgetId)
    if (!history || history.length === 0) return

    const targetLevel = level ?? history.length - 2

    if (targetLevel < 0) {
      // 回到顶层，清除所有状态
      drilldownState.value.history.set(sourceWidgetId, [])
      // 清除所有目标图表的筛选
      const rules = allRules.value.filter((r) => r.sourceWidgetId === sourceWidgetId)
      for (const rule of rules) {
        for (const targetId of rule.targetWidgetIds) {
          clearLinkageState(targetId)
        }
      }
      logger.event(`钻取回退: #${sourceWidgetId} → 顶层`)
    } else {
      // 回退到指定层级
      const newHistory = history.slice(0, targetLevel + 1)
      drilldownState.value.history.set(sourceWidgetId, newHistory)
      // 恢复该层级的筛选条件
      const entry = newHistory[targetLevel]
      const rules = allRules.value.filter((r) => r.sourceWidgetId === sourceWidgetId)
      for (const rule of rules) {
        for (const targetId of rule.targetWidgetIds) {
          clearLinkageState(targetId)
          applyFilter(targetId, entry.filters)
        }
      }
      logger.event(`钻取回退: #${sourceWidgetId} → 层级 ${targetLevel}`)
    }
  }

  /**
   * 获取指定图表的钻取面包屑路径
   */
  function getBreadcrumbs(sourceWidgetId: string): DrilldownHistoryEntry[] {
    return drilldownState.value.history.get(sourceWidgetId) ?? []
  }

  /**
   * 获取指定图表的当前筛选条件
   */
  function getActiveFilters(widgetId: string): Record<string, unknown> {
    return drilldownState.value.activeFilters.get(widgetId) ?? {}
  }

  /**
   * 获取指定图表的高亮索引集合
   */
  function getHighlights(widgetId: string): Set<number> {
    return drilldownState.value.highlights.get(widgetId) ?? new Set()
  }

  /**
   * 判断指定图表是否有活跃的钻取状态
   */
  function hasDrilldown(sourceWidgetId: string): boolean {
    const history = drilldownState.value.history.get(sourceWidgetId)
    return !!history && history.length > 0
  }

  /**
   * 重置所有联动状态
   */
  function resetAll() {
    drilldownState.value = {
      history: new Map(),
      activeFilters: new Map(),
      highlights: new Map(),
    }
  }

  return {
    drilldownState,
    handleChartClick,
    drilldownBack,
    getBreadcrumbs,
    getActiveFilters,
    getHighlights,
    hasDrilldown,
    resetAll,
  }
}
