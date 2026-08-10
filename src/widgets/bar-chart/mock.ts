import type { ChartWidgetMock } from "../base/widgetMock";

/** 柱状图 — 默认 mock（month度申请量） */
export const barChartMock: ChartWidgetMock = {
  kind: "chart",
  staticData: [
    { category: "Jan", value: 42 },
    { category: "Feb", value: 38 },
    { category: "Mar", value: 55 },
    { category: "Apr", value: 48 },
    { category: "May", value: 62 },
  ],
};
