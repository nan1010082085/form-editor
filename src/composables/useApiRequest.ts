/**
 * useApiRequest -- 通用 API 请求 composable
 *
 * 封装 apiClient.requestUrl，统一经过 token 注入和拦截器链。
 * 返回解析后的 JSON 数据。
 */
import { apiClient } from '@/utils/apiClient'

export function useApiRequest() {
  async function fetchApi(
    url: string,
    method: string = 'get',
    headers: Record<string, string> = {},
    params?: unknown,
  ): Promise<unknown> {
    return apiClient.requestUrl(method, url, params, headers)
  }

  return { fetchApi }
}
