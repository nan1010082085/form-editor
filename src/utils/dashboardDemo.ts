/**
 * dashboardDemo — E1 验收用大屏 demo 种子
 *
 * 10+ 图表 + 标题/时钟/筛选 + 深色主题 + 联动字段。
 * 新建实例选择「运营大屏 Demo」即可得到可编辑、可发布的完整画布。
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
  w.position = {
    ...w.position,
    x,
    y,
    w: width,
    h: height,
    xUnit: 'px',
    yUnit: 'px',
    wUnit: 'px',
    hUnit: 'px',
    zIndex: 1,
  }
  return w
}

/** 区域筛选 → 图表可见性联动 */
function regionVisibilityLinkage(): SchemaLinkage {
  return {
    type: 'visible',
    watchFields: ['region'],
    condition: 'values.region !== "hidden"',
  }
}

export function seedDashboardDemo(): { widgets: Widget[]; canvas: CanvasConfig } {
  const dark = BOARD_THEME_PRESETS.find(p => p.id === 'dashboard-dark')!

  const title = place(mustCreate('title'), 40, 24, 600, 48)
  title.props = { ...title.props, text: '运营数据大屏 Demo', level: 1 }
  title.style = { ...title.style, color: '#e8eaed', fontSize: '28px' }

  const clock = place(mustCreate('realtime-clock'), 1600, 24, 280, 48)
  clock.props = { ...clock.props, format: 'YYYY-MM-DD HH:mm:ss' }

  const filter = place(mustCreate('select'), 40, 90, 240, 40)
  filter.field = 'region'
  filter.label = '区域'
  filter.options = [
    { label: '全部', value: 'all' },
    { label: '华东', value: 'east' },
    { label: '华南', value: 'south' },
    { label: '隐藏图表', value: 'hidden' },
  ]
  filter.defaultValue = 'all'

  const charts: Array<{ type: Parameters<typeof createWidget>[0]; x: number; y: number; w: number; h: number; label: string }> = [
    { type: 'bar-chart', x: 40, y: 160, w: 440, h: 280, label: '销售额' },
    { type: 'line-chart', x: 500, y: 160, w: 440, h: 280, label: '趋势' },
    { type: 'pie-chart', x: 960, y: 160, w: 440, h: 280, label: '占比' },
    { type: 'gauge', x: 1420, y: 160, w: 460, h: 280, label: '达成率' },
    { type: 'radar', x: 40, y: 460, w: 440, h: 280, label: '能力雷达' },
    { type: 'scatter-chart', x: 500, y: 460, w: 440, h: 280, label: '散点分布' },
    { type: 'heatmap', x: 960, y: 460, w: 440, h: 280, label: '热力' },
    { type: 'funnel', x: 1420, y: 460, w: 460, h: 280, label: '转化漏斗' },
    { type: 'candlestick', x: 40, y: 760, w: 600, h: 280, label: 'K 线' },
    { type: 'treemap', x: 660, y: 760, w: 600, h: 280, label: '矩形树图' },
    { type: 'rank-list', x: 1280, y: 760, w: 600, h: 280, label: '排行榜' },
    { type: 'statistic', x: 40, y: 1060, w: 280, h: 120, label: '总访问' },
    { type: 'comparison-card', x: 340, y: 1060, w: 320, h: 120, label: '同比' },
    { type: 'progress-bar', x: 680, y: 1060, w: 400, h: 120, label: '进度' },
  ]

  const chartWidgets = charts.map((c, i) => {
    const w = place(mustCreate(c.type), c.x, c.y, c.w, c.h)
    w.label = c.label
    w.field = `chart_${i}`
    w.linkages = [regionVisibilityLinkage()]
    w.style = { ...w.style, animation: 'fade-in' }
    return w
  })

  const refresh = place(mustCreate('auto-refresh'), 1100, 1060, 200, 48)
  refresh.props = { ...refresh.props, interval: 30, enabled: true }

  return {
    widgets: [title, clock, filter, ...chartWidgets, refresh],
    canvas: {
      width: 1920,
      height: 1200,
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
