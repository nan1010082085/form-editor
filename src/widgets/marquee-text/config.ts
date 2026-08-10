import type { WidgetConfig } from "../base/types";

export const marqueeTextConfig: WidgetConfig = {
  name: "FgMarqueeText",
  displayName: "Marquee",
  description: "Horizontal scrolling text with data source",
  author: "yangdongnan",
  defaultStyle: { width: "100%" },
  defaultProps: {
    text: "This is a scrolling announcement, supports custom content and speed",
    speed: 50,
    direction: "left",
    pauseOnHover: true,
    loop: true,
  },
  exposedValues: [{ key: "text", type: "string", description: "Current Text" }],
  configPanels: ["api", "variables"],
  receivableEvents: [
    {
      name: "set-text",
      description: "Set Scroll Text",
      params: { text: "Text Content" },
    },
    { name: "pause", description: "Pause Scroll" },
    { name: "resume", description: "Resume Scroll" },
  ],
  propertyPanel: {
    basic: ["label"],
    style: ["margin", "padding", "backgroundColor"],
    props: [
      { key: "text", label: "Scroll Text", type: "text" },
      {
        key: "speed",
        label: "Scroll Speed",
        type: "number",
        default: 50,
        desc: "Larger is faster",
      },
      {
        key: "direction",
        label: "Scroll Direction",
        type: "select",
        default: "left",
        options: [
          { label: "Left", value: "left" },
          { label: "Right", value: "right" },
        ],
      },
      { key: "pauseOnHover", label: "Hover Pause", type: "switch", default: true },
      { key: "loop", label: "Loop", type: "switch", default: true },
    ],
  },
};

export function createMarqueeTextWidget(id: string) {
  return {
    id,
    name: marqueeTextConfig.name,
    type: "marquee-text" as const,
    label: "Marquee",
    props: { ...marqueeTextConfig.defaultProps },
    style: { ...marqueeTextConfig.defaultStyle },
    position: {
      x: 0,
      y: 0,
      w: 600,
      h: 40,
      xUnit: "px" as const,
      yUnit: "px" as const,
      wUnit: "px" as const,
      hUnit: "px" as const,
      zIndex: 1,
    },
  };
}
