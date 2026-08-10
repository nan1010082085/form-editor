import type { StatisticWidgetMock } from "../base/widgetMock";

/** Statistics卡片 — Default mock（工作台 KPI） */
export const statisticMock: StatisticWidgetMock = {
  kind: "statistic",
  defaultProps: {
    title: "总User数",
    value: 12345,
    prefix: "",
    suffix: "件",
    precision: 0,
    trend: "up",
    trendValue: "较昨日 +12.5%",
    color: "#409EFF",
  },
};
