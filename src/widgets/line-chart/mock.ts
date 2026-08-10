import type { ChartWidgetMock } from "../base/widgetMock";

/** 折线图 - Default mock（审批Trend） */
export const lineChartMock: ChartWidgetMock = {
  kind: "chart",
  staticData: [
    { category: "week一", value: 12 },
    { category: "week二", value: 18 },
    { category: "week三", value: 15 },
    { category: "week四", value: 22 },
    { category: "week五", value: 19 },
  ],
};
