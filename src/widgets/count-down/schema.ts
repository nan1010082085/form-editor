import { nanoid } from "nanoid";
import type { Widget } from "../base/types";

export function createCountDownWidget(id?: string): Widget {
  return {
    id: id ?? nanoid(),
    name: "FgCountDown",
    type: "count-down",
    label: "Countdown",
    props: {
      targetTime: "",
      duration: 3600,
      format: "HH:mm:ss",
      autoStart: true,
      showLabels: true,
      labelDay: "day",
      labelHour: "Hrs",
      labelMinute: "Min",
      labelSecond: "sec",
      digitFontSize: "36px",
      labelFontSize: "12px",
      digitColor: "#303133",
      labelColor: "#909399",
      separator: ":",
      finishText: "",
    },
    style: { width: "100%", height: "120px", fontSize: "14px" },
    position: { x: 0, y: 0, w: 320, h: 120, zIndex: 1 },
    children: [],
  };
}
