/**
 * sankey Widget 默认Data
 */

/** Edit态预览用默认 props */
export const sankeyMock = {
  defaultProps: {
    orientation: "horizontal",
    nodeWidth: 20,
    nodeGap: 8,
    linkCurvature: 0.5,
    showLabels: true,
    labelPosition: "right",
    colorScheme: "default",
    emphasis: "adjacency",
  },
};

/** 示例节点Data */
export const SANKEY_MOCK_NODES = [
  { name: "Visited" },
  { name: "Added to Cart" },
  { name: "Purchased" },
  { name: "Browsed Only" },
  { name: "Abandoned Cart" },
];

/** 示例链接Data */
export const SANKEY_MOCK_LINKS = [
  { source: "Visited", target: "Added to Cart", value: 800 },
  { source: "Visited", target: "Browsed Only", value: 1200 },
  { source: "Added to Cart", target: "Purchased", value: 500 },
  { source: "Added to Cart", target: "Abandoned Cart", value: 300 },
];
