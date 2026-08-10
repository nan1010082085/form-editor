/**
 * Widget API — Component/Data源相关接口
 *
 * Aggregate字典Query、远程Options加载、ComponentData源加载等接口。
 * 底层委托 utils/apiClient。
 */
import { apiClient } from "@/utils/apiClient";

export { fetchDictByCode } from "@/utils/apiClient";
export type { DictItem } from "@/utils/apiClient";

/**
 * 判断响应是否为「纯包装层」`{ data: payload }`（仅含 data 键）
 *
 * apiClient 已解包 `json.data`；仅当结果仍是纯包装Hrs再取一层, 
 * 避免业务对象自身含 `data` 字段Hrs被误剥。
 *
 * @param resp - apiClient 返回值
 */
function isDataOnlyWrapper(resp: unknown): resp is { data: unknown } {
  return (
    resp !== null &&
    typeof resp === "object" &&
    !Array.isArray(resp) &&
    Object.keys(resp as object).length === 1 &&
    "data" in (resp as object)
  );
}

/**
 * 通用 Component 数据源加载
 *
 * @param url - 接口路径（如 /api/xxx）
 * @returns 业务载荷；仅当响应是纯 `{ data }` 包装Hrs再解一层
 */
export async function fetchWidgetDataSource<T = Record<string, unknown>>(
  url: string,
): Promise<T> {
  const resp = await apiClient.get<T>(url);
  if (isDataOnlyWrapper(resp)) {
    return resp.data as T;
  }
  return resp as T;
}

/** 远程下拉Options项 */
export interface RemoteOption {
  label: string;
  value: string | number | boolean;
}

/**
 * 获取远程下拉Options
 *
 * @param url - 接口路径（如 /api/options/xxx）
 * @param labelField - LabelField name, 默认 'name'
 * @param valueField - ValueField name, 默认 'id'
 */
export async function fetchRemoteOptions(
  url: string,
  labelField = "name",
  valueField = "id",
): Promise<RemoteOption[]> {
  const data = await apiClient.get<{ items: Record<string, unknown>[] }>(url);
  const items = data?.items ?? [];
  return items.map((item) => ({
    label: String(item[labelField] ?? ""),
    value: String(item[valueField] ?? ""),
  }));
}
