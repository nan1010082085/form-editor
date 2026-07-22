/**
 * seedStressDashboard - 100+ widget FPS 性能压测种子
 *
 * 用于真实浏览器 FPS 演练（/perf 路由）。生成 120 个 widget：
 * - 1 标题 + 1 时钟 + 1 筛选 + 1 刷新
 * - 100 个图表（bar/line/pie/gauge/radar/scatter/heatmap/funnel 循环）
 * - 16 个统计/进度卡片
 * 全部带 region 可见性联动，模拟真实联动开销。
 */
import type { Widget, CanvasConfig, SchemaLinkage } from '@/widgets/base/types'
import { createWidget, generateWidgetId } from '@/widgets/registry'
import { BOARD_THEME_PRESETS } from '@/utils/boardThemes'

function mustCreate(type: Parameters<typeof createWidget>[0]): Widget {
  const id = generateWidgetId(type)
  const w = createWidget(type, id)
  if (!w) throw new Error(`Widget type not registered: ${type}`)
  return w
}

function place(w: Widget, x: number, y: number, width: number, height: number): Widget {
  w.position = { ...w.position, x, y, w: width, h: height, xUnit: 'px', yUnit: 'px', wUnit: 'px', hUnit: 'px', zIndex: 1 }
  return w
}

function regionVisibilityLinkage(): SchemaLinkage {
  return { type: 'visible', watchFields: ['region'], condition: 'values.region !== "hidden"' }
}

const CHART_CYCLE = ['bar-chart', 'line-chart', 'pie-chart', 'gauge', 'radar', 'scatter-chart', 'heatmap', 'funnel'] as const

export function seedStressDashboard(count: number = 120): { widgets: Widget[]; canvas: CanvasConfig } {
  const dark = BOARD_THEME_PRESETS.find(p => p.id === 'dashboard-dark')!

  const widgets: Widget[] = []

  const title = place(mustCreate('title'), 40, 24, 600, 48)
  title.props = { ...title.props, text: `性能压测大屏 (${count} widgets)`, level: 1 }
  title.style = { ...title.style, color: '#e8eaed', fontSize: '28px' }
  widgets.push(title)

  const clock = place(mustCreate('realtime-clock'), 1600, 24, 280, 48)
  widgets.push(clock)

  const filter = place(mustCreate('select'), 40, 90, 240, 40)
  filter.field = 'region'
  filter.label = '区域'
  filter.options = [
    { label: '全部', value: 'all' },
    { label: '隐藏图表', value: 'hidden' },
  ]
  filter.defaultValue = 'all'
  widgets.push(filter)

  // 网格排布图表：每行 4 个，间距 20px
  const cols = 4
  const cellW = 440
  const cellH = 220
  const gap = 20
  const startX = 40
  const startY = 160

  const chartCount = Math.max(0, count - 20) // 留 20 给卡片
  for (let i = 0; i < chartCount; i++) {
    const type = CHART_CYCLE[i % CHART_CYCLE.length]
    const row = Math.floor(i / cols)
    const col = i % cols
    const w = place(mustCreate(type), startX + col * (cellW + gap), startY + row * (cellH + gap), cellW, cellH)
    w.label = `${type}-${i}`
    w.field = `chart_${i}`
    w.linkages = [regionVisibilityLinkage()]
    widgets.push(w)
  }

  // 底部一行统计/进度卡片
  const cardStartY = startY + Math.ceil(chartCount / cols) * (cellH + gap)
  const cardTypes = ['statistic', 'comparison-card', 'progress-bar'] as const
  const cardCount = Math.min(16, Math.max(0, count - chartCount - 4))
  for (let i = 0; i < cardCount; i++) {
    const type = cardTypes[i % cardTypes.length]
    const w = place(mustCreate(type), startX + i * 300, cardStartY, 280, 120)
    w.label = `card-${i}`
    widgets.push(w)
  }

  return {
    widgets,
    canvas: {
      width: 1920,
      height: cardStartY + 200,
      widthUnit: 'px',
      heightUnit: 'px',
      backgroundColor: dark.canvas.backgroundColor ?? '#0a1628',
      padding: '0px',
      zoom: 100,
      layoutMode: 'free',
      themePreset: 'dashboard-dark',
      freeLayout: { contentAlign: 'left', marginX: '0' },
    },
  }
}
