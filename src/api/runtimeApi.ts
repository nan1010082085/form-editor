/**
 * Runtime API — 运RowHrs/Schema Config的动态 URL 请求
 *
 * 供 widget、composable、editor Component调用 schema 中Config的外部 API URL。
 * 底层委托 utils/apiClient, 统一 token 注入和Error处理。
 */
import { apiClient } from "@/utils/apiClient";

/**
 * 发送请求到 schema Config的 URL（不拼接 baseUrl）
 *
 * @param method - HTTP 方法
 * @param url - 完整 URL
 * @param params - GET Params或 POST body
 * @param headers - 自定义请求头
 * @param timeout - 超HrsHrs间（毫sec）
 */
export async function fetchRuntimeUrl<T = unknown>(
  method: string,
  url: string,
  params?: unknown,
  headers?: Record<string, string>,
  timeout?: number,
): Promise<T> {
  return apiClient.requestUrl<T>(method, url, params, headers, timeout);
}
