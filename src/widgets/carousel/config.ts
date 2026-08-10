import type { WidgetConfig } from "../base/types";
import { carouselMock } from "./mock";

export const carouselConfig: WidgetConfig = {
  name: "FgCarousel",
  displayName: "Carousel",
  description: "Carousel container for auto/manual switching between child pages",
  author: "yangdongnan",
  defaultStyle: { width: "100%", height: "400px" },
  defaultProps: {
    ...carouselMock.defaultProps,
  },
  configPanels: ["events", "variables"],
  exposedValues: [
    { key: "activeIndex", type: "number", description: "Current active page index" },
    { key: "totalPages", type: "number", description: "Total number of pages" },
  ],
  receivableEvents: [
    { name: "next", description: "Go to next page" },
    { name: "prev", description: "Go to previous page" },
    { name: "goto", description: "Go to specific page", params: { index: "Page index" } },
  ],
  propertyPanel: {
    basic: ["label"],
    style: ["margin", "padding", "backgroundColor", "borderRadius"],
    props: [
      {
        key: "autoPlay",
        label: "Auto Play",
        type: "switch",
        default: true,
        desc: "Automatically switch pages",
      },
      {
        key: "interval",
        label: "Interval (ms)",
        type: "number",
        default: 3000,
        desc: "Time between auto-plays in milliseconds",
      },
      {
        key: "showDots",
        label: "Show Dots",
        type: "switch",
        default: true,
        desc: "Show navigation dots at the bottom",
      },
      {
        key: "showArrows",
        label: "Show Arrows",
        type: "switch",
        default: true,
        desc: "Show prev/next arrows on hover",
      },
      {
        key: "arrowPosition",
        label: "Arrow Position",
        type: "select",
        default: "inside",
        options: [
          { label: "Inside", value: "inside" },
          { label: "Outside", value: "outside" },
        ],
      },
      {
        key: "dotPosition",
        label: "Dot Position",
        type: "select",
        default: "bottom",
        options: [
          { label: "Bottom", value: "bottom" },
          { label: "Top", value: "top" },
        ],
      },
      {
        key: "transition",
        label: "Transition",
        type: "select",
        default: "slide",
        options: [
          { label: "Slide", value: "slide" },
          { label: "Fade", value: "fade" },
        ],
      },
      {
        key: "transitionDuration",
        label: "Transition Duration (ms)",
        type: "number",
        default: 300,
      },
      {
        key: "pauseOnHover",
        label: "Pause on Hover",
        type: "switch",
        default: true,
        desc: "Pause auto-play when mouse hovers",
      },
      {
        key: "loop",
        label: "Loop",
        type: "switch",
        default: true,
        desc: "Loop back to first page after last",
      },
      {
        key: "initialIndex",
        label: "Initial Page",
        type: "number",
        default: 0,
        desc: "Index of the initial page to show",
      },
    ],
  },
};
