/**
 * gridEngine - 移植自 formily Grid 引擎，简化适配 Vue 响应式
 *
 * 核心能力（对齐 formily）：
 * 1. columns -- 根据容器宽度 + minColumns/maxColumns/minWidth/maxWidth/gap 算最优列数
 * 2. templateColumns -- repeat(N, minmax(minW, maxW))
 * 3. gap -- `${rowGap}px ${columnGap}px`
 * 4. resolveChildSpan -- 子节点 span 超出剩余列时自动收缩，-1 表示撑满剩余
 *
 * 简化（编辑器不需要）：
 * - breakpoints / calcFactor -- 无响应式断点
 * - strictAutoFit -- 无严格自适应
 * - shouldVisible -- 无条件显示控制
 * - MutationObserver -- Vue 响应式自动触发重算
 * - @formily/reactive -- 用 Vue ref/computed
 */

export interface GridOptions {
  maxColumns?: number;
  minColumns?: number;
  maxWidth?: number;
  minWidth?: number;
  columnGap?: number;
  rowGap?: number;
  colWrap?: boolean;
}

export interface GridChild {
  /** 原始 span（用户设定值），-1 = 撑满剩余列 */
  originSpan: number;
  visible: boolean;
}

export interface GridResolveResult {
  /** 实际分配的 span（不超出当前行剩余列） */
  span: number;
  /** grid-column CSS 值 */
  gridColumn: string;
}

const isValid = (value: unknown): value is number =>
  value !== undefined && value !== null;

/**
 * 在 [minColumns, maxColumns] 范围内，找到满足 minWidth/maxWidth 约束的最优列数。
 * 直接移植自 formily calcSatisfyColumns。
 */
function calcSatisfyColumns(
  width: number,
  maxColumns: number,
  minColumns: number,
  maxWidth: number,
  minWidth: number,
  gap: number,
): number {
  const results: number[] = [];
  for (let columns = minColumns; columns <= maxColumns; columns++) {
    const innerWidth = width - (columns - 1) * gap;
    const columnWidth = innerWidth / columns;
    if (columnWidth >= minWidth && columnWidth <= maxWidth) {
      results.push(columns);
    } else if (columnWidth < minWidth) {
      results.push(Math.min(Math.floor(innerWidth / minWidth), maxColumns));
    } else if (columnWidth > maxWidth) {
      results.push(Math.min(Math.floor(innerWidth / maxWidth), maxColumns));
    }
  }
  return Math.max(...results);
}

/**
 * 计算最优列数。直接移植自 formily Grid.columns getter。
 *
 * 逻辑：
 * 1. colWrap=false -> 不换行，列数 = 子节点 span 总和
 * 2. 根据 maxWidth 算最多能放多少列（maxWidthColumns）
 * 3. 根据 minWidth 算最少需要多少列（minWidthColumns）
 * 4. 在 [min, max] 范围内用 calcSatisfyColumns 找最优值
 * 5. 最终 clamp 到 [minColumns, maxColumns]
 */
export function computeColumns(
  width: number,
  children: GridChild[],
  options: Required<Pick<GridOptions, "maxColumns" | "minColumns" | "maxWidth" | "minWidth" | "columnGap" | "colWrap">>,
): number {
  const originTotalColumns = children.reduce(
    (sum, c) => (c.visible ? sum + (c.originSpan === -1 ? 1 : c.originSpan) : sum),
    0,
  );

  if (options.colWrap === false) {
    return originTotalColumns;
  }

  const childSize = children.filter((c) => c.visible).length;

  const strictMaxWidthColumns = Math.round(
    width / (options.maxWidth + options.columnGap),
  );
  const looseMaxWidthColumns = Math.min(originTotalColumns, strictMaxWidthColumns);
  const maxWidthColumns = looseMaxWidthColumns;

  const strictMinWidthColumns = Math.round(
    width / (options.minWidth + options.columnGap),
  );
  const looseMinWidthColumns = Math.min(originTotalColumns, strictMinWidthColumns);
  const minWidthColumns = looseMinWidthColumns;

  const minCalculated = Math.min(
    childSize,
    originTotalColumns,
    maxWidthColumns,
    minWidthColumns,
  );
  const maxCalculated = Math.max(
    childSize,
    originTotalColumns,
    maxWidthColumns,
    minWidthColumns,
  );

  const finalColumns = calcSatisfyColumns(
    width,
    maxCalculated,
    minCalculated,
    options.maxWidth,
    options.minWidth,
    options.columnGap,
  );

  if (finalColumns >= options.maxColumns) return options.maxColumns;
  if (finalColumns <= options.minColumns) return options.minColumns;
  return finalColumns;
}

/**
 * 生成 grid-template-columns 值。移植自 formily Grid.templateColumns getter。
 */
export function computeTemplateColumns(
  width: number,
  columns: number,
  maxWidth: number,
  minWidth: number,
  columnGap: number,
): string {
  if (!width) return "";
  if (maxWidth === Infinity) {
    return `repeat(${columns}, minmax(0, 1fr))`;
  }
  const columnWidth = (width - (columns - 1) * columnGap) / columns;
  if (columnWidth < minWidth || columnWidth > maxWidth) {
    return `repeat(${columns}, minmax(0, 1fr))`;
  }
  return `repeat(${columns}, minmax(${minWidth}px, ${maxWidth}px))`;
}

/**
 * 计算子节点在当前列数下的实际 span 和 grid-column 值。
 * 移植自 formily resolveChildren，但改为纯函数（不操作 DOM）。
 *
 * - originSpan > columns -> 收缩到 columns
 * - originSpan > 当前行剩余列 -> 收缩到剩余列
 * - originSpan === -1 -> 撑满剩余列 `span N / -1`
 */
export function resolveChildSpan(
  originSpan: number,
  walkedColumns: number,
  totalColumns: number,
): GridResolveResult {
  const columnIndex = walkedColumns % totalColumns;
  const remainColumns = totalColumns - columnIndex;

  // originSpan=-1: 撑满剩余列
  if (originSpan === -1) {
    return {
      span: remainColumns,
      gridColumn: `span ${remainColumns} / -1`,
    };
  }

  const targetSpan = originSpan > totalColumns ? totalColumns : originSpan;
  const span = targetSpan > remainColumns ? remainColumns : targetSpan;

  return {
    span,
    gridColumn: `span ${span} / auto`,
  };
}

/**
 * 解析 GridOptions，填充默认值。
 */
export function resolveGridOptions(
  options: GridOptions | undefined,
): Required<GridOptions> {
  return {
    maxColumns: options?.maxColumns ?? Infinity,
    minColumns: options?.minColumns ?? 1,
    maxWidth: options?.maxWidth ?? Infinity,
    minWidth: options?.minWidth ?? 100,
    columnGap: options?.columnGap ?? 8,
    rowGap: options?.rowGap ?? 12,
    colWrap: options?.colWrap ?? true,
  };
}

/**
 * 计算完整 grid 布局结果（templateColumns + gap + 每个子节点的 gridColumn）。
 *
 * 用法：
 * ```ts
 * const result = computeGridLayout(width, children, options);
 * // 容器: style.gridTemplateColumns = result.templateColumns
 * //       style.gap = result.gap
 * // 子节点: style.gridColumn = result.children[i].gridColumn
 * ```
 */
export function computeGridLayout(
  width: number,
  children: GridChild[],
  options: GridOptions | undefined,
): {
  columns: number;
  templateColumns: string;
  gap: string;
  children: GridResolveResult[];
} {
  const resolved = resolveGridOptions(options);
  const visibleChildren = children.filter((c) => c.visible);

  if (visibleChildren.length === 0 || !width) {
    return {
      columns: 0,
      templateColumns: "",
      gap: `${resolved.rowGap}px ${resolved.columnGap}px`,
      children: [],
    };
  }

  const columns = computeColumns(width, visibleChildren, resolved);
  const templateColumns = computeTemplateColumns(
    width,
    columns,
    resolved.maxWidth,
    resolved.minWidth,
    resolved.columnGap,
  );

  let walked = 0;
  const childResults = children.map((child) => {
    if (!child.visible) {
      return { span: 0, gridColumn: "none" };
    }
    const result = resolveChildSpan(child.originSpan, walked, columns);
    walked += result.span;
    return result;
  });

  return {
    columns,
    templateColumns,
    gap: `${resolved.rowGap}px ${resolved.columnGap}px`,
    children: childResults,
  };
}
