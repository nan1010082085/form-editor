import { nanoid } from "nanoid";
import type { Widget } from "../base/types";

export function createScoreCardWidget(id?: string): Widget {
  return {
    id: id ?? nanoid(),
    name: "FgScoreCard",
    type: "score-card",
    field: "scoreCard",
    label: "Score Card",
    props: {
      score: 0,
      maxScore: 100,
      level: "medium",
      description: "",
      showLevel: true,
    },
    style: { width: "100%", height: "auto", fontSize: "14px" },
    position: { x: 0, y: 0, w: 280, h: 100, zIndex: 1 },
    children: [],
  };
}
