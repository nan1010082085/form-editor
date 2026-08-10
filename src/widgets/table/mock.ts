import type { TableWidgetMock } from "../base/widgetMock";

export const tableMock: TableWidgetMock = {
  kind: "table",
  total: 5,
  rows: [
    { name: "Zhang San", age: 28 },
    { name: "Li Si", age: 32 },
    { name: "Wang Wu", age: 25 },
    { name: "Zhao Liu", age: 41 },
    { name: "Qian Qi", age: 36 },
  ],
};
