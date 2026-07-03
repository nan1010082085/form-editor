import type { TableWidgetMock } from '../base/widgetMock'

export const tableMock: TableWidgetMock = {
  kind: 'table',
  total: 5,
  rows: [
    { name: '张三', age: 28 },
    { name: '李四', age: 32 },
    { name: '王五', age: 25 },
    { name: '赵六', age: 41 },
    { name: '钱七', age: 36 },
  ],
}
