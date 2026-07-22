import type { StatisticWidgetMock } from '../base/widgetMock'

/** 统计卡片 — 默认 mock（工作台 KPI） */
export const statisticMock: StatisticWidgetMock = {
  kind: 'statistic',
  defaultProps: {
    title: '总用户数',
    value: 12345,
    prefix: '',
    suffix: '件',
    precision: 0,
    trend: 'up',
    trendValue: '较昨日 +12.5%',
    color: '#409EFF',
  },
}
