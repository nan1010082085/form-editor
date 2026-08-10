import { nanoid } from "nanoid";
import type { Widget } from "../base/types";
import { SANKEY_MOCK_NODES, SANKEY_MOCK_LINKS } from "./mock";

export function createSankeyWidget(id?: string): Widget {
  return {
    id: id ?? nanoid(),
    name: "FgSankey",
    type: "sankey",
    label: "Sankey Chart",
    props: {
      orientation: "horizontal",
      nodeWidth: 20,
      nodeGap: 8,
      linkCurvature: 0.5,
      showLabels: true,
      labelPosition: "right",
      colorScheme: "default",
      emphasis: "adjacency",
      nodes: SANKEY_MOCK_NODES,
      links: SANKEY_MOCK_LINKS,
    },
    style: { width: "100%", height: "400px", fontSize: "14px" },
    position: { x: 0, y: 0, w: 600, h: 400, zIndex: 1 },
    children: [],
  };
}
