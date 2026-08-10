import type { WidgetConfig } from "../base/types";
import { countDownMock } from "./mock";

export const countDownConfig: WidgetConfig = {
  name: "FgCountDown",
  displayName: "Countdown",
  description: "Countdown timer for dashboards, supports target time and finish event",
  author: "yangdongnan",
  defaultStyle: { width: "100%", height: "120px" },
  defaultProps: {
    ...countDownMock.defaultProps,
  },
  configPanels: ["events", "variables"],
  exposedValues: [
    { key: "remaining", type: "number", description: "Remaining seconds" },
    { key: "finished", type: "boolean", description: "Whether countdown finished" },
    { key: "days", type: "number", description: "Remaining days" },
    { key: "hours", type: "number", description: "Remaining hours" },
    { key: "minutes", type: "number", description: "Remaining minutes" },
    { key: "seconds", type: "number", description: "Remaining seconds (0-59)" },
  ],
  receivableEvents: [
    { name: "start", description: "Start the countdown" },
    { name: "pause", description: "Pause the countdown" },
    { name: "reset", description: "Reset the countdown" },
  ],
  propertyPanel: {
    basic: ["label"],
    style: ["margin", "padding", "backgroundColor", "borderRadius"],
    props: [
      {
        key: "targetTime",
        label: "Target Time",
        type: "datetime",
        default: "",
        desc: "ISO 8601 timestamp or Unix timestamp (ms)",
      },
      {
        key: "duration",
        label: "Duration (seconds)",
        type: "number",
        default: 0,
        desc: "Alternative to targetTime: countdown from N seconds",
      },
      {
        key: "format",
        label: "Display Format",
        type: "select",
        default: "HH:mm:ss",
        options: [
          { label: "HH:mm:ss", value: "HH:mm:ss" },
          { label: "DD:HH:mm:ss", value: "DD:HH:mm:ss" },
          { label: "HH:mm", value: "HH:mm" },
          { label: "mm:ss", value: "mm:ss" },
          { label: "Total Seconds", value: "total-seconds" },
        ],
      },
      {
        key: "autoStart",
        label: "Auto Start",
        type: "switch",
        default: true,
      },
      {
        key: "showLabels",
        label: "Show Labels",
        type: "switch",
        default: true,
      },
      {
        key: "labelDay",
        label: "Day Label",
        type: "input",
        default: "Days",
      },
      {
        key: "labelHour",
        label: "Hour Label",
        type: "input",
        default: "Hours",
      },
      {
        key: "labelMinute",
        label: "Minute Label",
        type: "input",
        default: "Minutes",
      },
      {
        key: "labelSecond",
        label: "Second Label",
        type: "input",
        default: "Seconds",
      },
      {
        key: "digitFontSize",
        label: "Digit Font Size",
        type: "input",
        default: "36px",
      },
      {
        key: "labelFontSize",
        label: "Label Font Size",
        type: "input",
        default: "12px",
      },
      {
        key: "digitColor",
        label: "Digit Color",
        type: "color",
        default: "#303133",
      },
      {
        key: "labelColor",
        label: "Label Color",
        type: "color",
        default: "#909399",
      },
      {
        key: "separator",
        label: "Separator",
        type: "input",
        default: ":",
        desc: "Character between groups",
      },
      {
        key: "finishText",
        label: "Finish Text",
        type: "input",
        default: "",
        desc: "Text to show when countdown finishes (empty = show 00:00:00)",
      },
    ],
  },
};
