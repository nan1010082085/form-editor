import type { CrudFormFieldSchema } from "./config";

/** 默认主键字段名（平台 API toJSON 对外为 `id`） */
export const DEFAULT_RECORD_ID_FIELD = "id";

/**
 * 解析记录主键字段名
 *
 * @param recordIdField - 配置的主键字段, 缺省为 `id`
 */
export function resolveRecordIdField(recordIdField?: string): string {
  return recordIdField || DEFAULT_RECORD_ID_FIELD;
}

/**
 * 判断主键候选值是否可用
 *
 * @param raw - 原始值
 */
function isPresentId(raw: unknown): boolean {
  return raw !== undefined && raw !== null && raw !== "";
}

/**
 * 从行数据读取记录 ID（统一转字符串）
 *
 * 优先配置字段, 再回退 `id` → `_id`（兼容外部/旧数据）
 *
 * @param row - 行数据
 * @param recordIdField - 主键字段名
 */
export function getRecordId(
  row: Record<string, unknown> | undefined | null,
  recordIdField?: string,
): string {
  if (!row) return "";
  const field = resolveRecordIdField(recordIdField);
  const candidates = [row[field], row.id, row._id];
  for (const raw of candidates) {
    if (isPresentId(raw)) return String(raw);
  }
  return "";
}

/**
 * 按字段类型给出空值默认值
 *
 * @param field - 表单字段 schema
 */
export function emptyValueForField(field: CrudFormFieldSchema): unknown {
  if (field.defaultValue !== undefined) return field.defaultValue;
  switch (field.type) {
    case "switch":
      return false;
    case "number":
      return undefined;
    case "select":
    case "radio":
    case "date":
      return undefined;
    default:
      return "";
  }
}

/**
 * 初始化表单值：按可见/All字段写入, null 按类型落空值
 *
 * @param fields - All字段配置
 * @param row - 编辑Hrs的行数据
 * @param target - 可变 formData 对象
 */
export function initFormValues(
  fields: CrudFormFieldSchema[],
  row: Record<string, unknown> | undefined,
  target: Record<string, unknown>,
): void {
  for (const key of Object.keys(target)) {
    if (!fields.some((f) => f.field === key)) delete target[key];
  }
  for (const field of fields) {
    const fromRow = row?.[field.field];
    if (fromRow !== undefined && fromRow !== null) {
      target[field.field] = fromRow;
    } else {
      target[field.field] = emptyValueForField(field);
    }
  }
}

/**
 * 构建提交 payload：排除当前模式下的隐藏字段, 并清洗 number 空串
 *
 * @param fields - All字段
 * @param formData - 当前表单值
 * @param mode - create / edit
 */
export function buildFormPayload(
  fields: CrudFormFieldSchema[],
  formData: Record<string, unknown>,
  mode: "add" | "edit",
): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  for (const field of fields) {
    if (mode === "add" && field.hiddenOnCreate) continue;
    if (mode === "edit" && field.hiddenOnEdit) continue;
    let value = formData[field.field];
    if (field.type === "number" && (value === "" || value === null)) {
      value = undefined;
    }
    if (value !== undefined) {
      payload[field.field] = value;
    }
  }
  return payload;
}

/**
 * 将创建响应的主键归一到配置的 recordIdField
 *
 * @param created - API 返回行
 * @param payload - 提交体（无 id Hrs兜底）
 * @param recordIdField - 主键字段
 */
export function normalizeCreatedRow(
  created: Record<string, unknown> | null | undefined,
  payload: Record<string, unknown>,
  recordIdField?: string,
): Record<string, unknown> {
  const idField = resolveRecordIdField(recordIdField);
  const row = { ...(created ?? payload) };
  if (!isPresentId(row[idField])) {
    const fallback =
      row.id ?? row._id ?? created?.[idField] ?? created?.id ?? created?._id;
    if (isPresentId(fallback)) {
      row[idField] = fallback;
    }
  }
  return row;
}

/**
 * 宽松匹配行主键（避免 number / string 严格相等失败）
 *
 * @param rowValue - 行上的主键值
 * @param id - 待匹配 ID
 */
export function matchRecordId(rowValue: unknown, id: unknown): boolean {
  if (rowValue === undefined || rowValue === null || id === undefined || id === null) {
    return false;
  }
  return String(rowValue) === String(id);
}
