import { nanoid } from "nanoid";
import type { Widget } from "../base/types";

export function createAiSuggestionPanelWidget(id?: string): Widget {
  return {
    id: id ?? nanoid(),
    name: "FgAiSuggestionPanel",
    type: "ai-suggestion-panel",
    field: "aiSuggestions",
    label: "AI建议面板",
    props: {
      title: "AI 建议",
      suggestions: [],
      showIcon: true,
      collapsible: true,
      defaultExpanded: true,
    },
    style: { width: "100%", height: "auto", fontSize: "14px" },
    position: { x: 0, y: 0, w: 320, h: 120, zIndex: 1 },
    children: [],
  };
}
