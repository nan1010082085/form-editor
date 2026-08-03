import { describe, it, expect } from "vitest";
import {
  computeColumns,
  computeTemplateColumns,
  resolveChildSpan,
  computeGridLayout,
  resolveGridOptions,
} from "@/utils/gridEngine";

describe("gridEngine", () => {
  describe("resolveGridOptions", () => {
    it("fills defaults", () => {
      const opts = resolveGridOptions(undefined);
      expect(opts.columnGap).toBe(8);
      expect(opts.rowGap).toBe(12);
      expect(opts.minColumns).toBe(1);
      expect(opts.maxColumns).toBe(Infinity);
      expect(opts.minWidth).toBe(100);
      expect(opts.maxWidth).toBe(Infinity);
      expect(opts.colWrap).toBe(true);
    });

    it("respects user values", () => {
      const opts = resolveGridOptions({
        columnGap: 16,
        rowGap: 24,
        minColumns: 2,
        maxColumns: 4,
        minWidth: 200,
        maxWidth: 400,
        colWrap: false,
      });
      expect(opts.columnGap).toBe(16);
      expect(opts.rowGap).toBe(24);
      expect(opts.minColumns).toBe(2);
      expect(opts.maxColumns).toBe(4);
      expect(opts.minWidth).toBe(200);
      expect(opts.maxWidth).toBe(400);
      expect(opts.colWrap).toBe(false);
    });
  });

  describe("computeColumns", () => {
    it("returns originTotalColumns when colWrap=false", () => {
      const cols = computeColumns(
        1000,
        [
          { originSpan: 2, visible: true },
          { originSpan: 3, visible: true },
        ],
        resolveGridOptions({ colWrap: false }),
      );
      expect(cols).toBe(5);
    });

    it("computes fewer columns with narrower container", () => {
      // 宽容器：5 个子节点可以分 5 列
      const wideCols = computeColumns(
        1200,
        Array.from({ length: 5 }, () => ({ originSpan: 1, visible: true })),
        resolveGridOptions({ minWidth: 100, columnGap: 8 }),
      );
      // 窄容器：列数受 minWidth 约束减少
      const narrowCols = computeColumns(
        300,
        Array.from({ length: 5 }, () => ({ originSpan: 1, visible: true })),
        resolveGridOptions({ minWidth: 100, columnGap: 8 }),
      );
      expect(narrowCols).toBeLessThan(wideCols);
    });

    it("respects minColumns constraint", () => {
      const cols = computeColumns(
        1000,
        [{ originSpan: 1, visible: true }],
        resolveGridOptions({ minColumns: 3, maxWidth: 200, columnGap: 8 }),
      );
      expect(cols).toBeGreaterThanOrEqual(3);
    });

    it("respects maxColumns constraint", () => {
      const cols = computeColumns(
        2000,
        [
          { originSpan: 1, visible: true },
          { originSpan: 1, visible: true },
          { originSpan: 1, visible: true },
          { originSpan: 1, visible: true },
          { originSpan: 1, visible: true },
          { originSpan: 1, visible: true },
        ],
        resolveGridOptions({ maxColumns: 3, minWidth: 50, columnGap: 8 }),
      );
      expect(cols).toBeLessThanOrEqual(3);
    });
  });

  describe("computeTemplateColumns", () => {
    it("returns 1fr when maxWidth is Infinity", () => {
      const tc = computeTemplateColumns(1000, 3, Infinity, 100, 8);
      expect(tc).toBe("repeat(3, minmax(0, 1fr))");
    });

    it("returns minmax when column width fits within bounds", () => {
      // width=1000, columns=3, maxWidth=400, minWidth=100, gap=8
      // columnWidth = (1000 - 2*8) / 3 = 328, within [100, 400]
      const tc = computeTemplateColumns(1000, 3, 400, 100, 8);
      expect(tc).toContain("minmax(100px, 400px)");
      expect(tc).toContain("repeat(3");
    });

    it("falls back to 1fr when column width exceeds maxWidth", () => {
      // width=1000, columns=3, maxWidth=300, minWidth=100, gap=8
      // columnWidth = (1000 - 16) / 3 = 328 > 300
      const tc = computeTemplateColumns(1000, 3, 300, 100, 8);
      expect(tc).toBe("repeat(3, minmax(0, 1fr))");
    });

    it("returns empty string when width is 0", () => {
      const tc = computeTemplateColumns(0, 3, 300, 100, 8);
      expect(tc).toBe("");
    });
  });

  describe("resolveChildSpan", () => {
    it("returns origin span when it fits", () => {
      const result = resolveChildSpan(2, 0, 4);
      expect(result.span).toBe(2);
      expect(result.gridColumn).toBe("span 2 / auto");
    });

    it("caps span to total columns", () => {
      const result = resolveChildSpan(6, 0, 4);
      expect(result.span).toBe(4);
    });

    it("shrinks to remaining columns in row", () => {
      // walked=3, totalColumns=4 -> remaining=1
      const result = resolveChildSpan(3, 3, 4);
      expect(result.span).toBe(1);
    });

    it("handles originSpan=-1 (fill remaining)", () => {
      const result = resolveChildSpan(-1, 2, 4);
      expect(result.span).toBe(2); // remaining = 4-2 = 2
      expect(result.gridColumn).toBe("span 2 / -1");
    });
  });

  describe("computeGridLayout", () => {
    it("returns empty for no children", () => {
      const result = computeGridLayout(1000, [], { rowGap: 12 });
      expect(result.columns).toBe(0);
      expect(result.templateColumns).toBe("");
      expect(result.children).toHaveLength(0);
    });

    it("returns empty for zero width", () => {
      const result = computeGridLayout(
        0,
        [{ originSpan: 1, visible: true }],
        { rowGap: 12 },
      );
      expect(result.columns).toBe(0);
    });

    it("computes full layout for multiple children", () => {
      const result = computeGridLayout(
        1000,
        [
          { originSpan: 2, visible: true },
          { originSpan: 1, visible: true },
          { originSpan: 1, visible: true },
        ],
        { rowGap: 12, columnGap: 8, maxColumns: 4, minWidth: 100 },
      );
      expect(result.columns).toBeGreaterThan(0);
      expect(result.templateColumns).toContain("repeat");
      expect(result.gap).toBe("12px 8px");
      expect(result.children).toHaveLength(3);
      expect(result.children[0].gridColumn).toContain("span");
    });

    it("skips hidden children in column calculation", () => {
      const result = computeGridLayout(
        1000,
        [
          { originSpan: 1, visible: true },
          { originSpan: 1, visible: false },
          { originSpan: 1, visible: true },
        ],
        { rowGap: 12, columnGap: 8, minWidth: 100 },
      );
      // Only 2 visible children
      expect(result.children).toHaveLength(3);
      expect(result.children[1].span).toBe(0);
    });
  });
});
