import type { StatisticWidgetMock } from '../base/widgetMock'

export const qrScannerMock: StatisticWidgetMock = {
  kind: 'statistic',
  defaultProps: {
    label: '扫码录入',
    placeholder: '扫码或输入编码',
  },
}
