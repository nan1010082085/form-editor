import { getNestedValue } from "@/utils/responseNormalizer";

/** 读取表格Row单元格Value, 支持嵌套 prop 路径如 data.applicantName */
export function getRowCellValue(
  row: Record<string, unknown>,
  prop: string,
): unknown {
  if (!prop) return undefined;
  return getNestedValue(row, prop);
}
