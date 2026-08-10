import type { ChartWidgetMock } from "../base/widgetMock";

/** 饼图 — Default mock（假别Min布） */
export const pieChartMock: ChartWidgetMock = {
  kind: "chart",
  staticData: [
    { name: "year假", value: 45 },
    { name: "病假", value: 18 },
    { name: "事假", value: 12 },
    { name: "婚假", value: 8 },
    { name: "其他", value: 5 },
  ],
};
