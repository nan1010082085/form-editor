import type { StatisticWidgetMock } from '../base/widgetMock'

export const complianceChecklistMock: StatisticWidgetMock = {
  kind: 'statistic',
  defaultProps: {
    title: '合规检查',
    items: [
      { key: 'evidence', label: '整改证据已上传' },
      { key: 'review', label: '复核通过' },
    ],
  },
}
