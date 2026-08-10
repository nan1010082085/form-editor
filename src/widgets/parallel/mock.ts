/**
 * parallel Widget 默认Data
 */

/** Edit态预览用默认 props */
export const parallelMock = {
  defaultProps: {
    smooth: false,
    lineWidth: 1,
    opacity: 0.5,
    colorScheme: "default",
  },
};

/** 示例DimensionConfig */
export const PARALLEL_MOCK_DIMENSIONS = [
  { name: "Price", min: 0, max: 1000 },
  { name: "Score", min: 0, max: 100 },
  { name: "Weight", min: 0, max: 500 },
  { name: "Rating", min: 1, max: 5 },
];

/** 示例Data */
export const PARALLEL_MOCK_DATA = [
  [120, 100, 1, "Product A"],
  [200, 80, 2, "Product B"],
  [150, 90, 3, "Product C"],
  [80, 70, 4, "Product D"],
  [300, 60, 5, "Product E"],
];
