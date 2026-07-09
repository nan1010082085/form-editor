/**
 * Data API — 数据/实例/凭据/租户相关接口
 *
 * 聚合表单数据、提交记录、凭据管理、租户管理等接口。
 * 底层委托 utils/apiClient。
 */
import { apiClient } from '@/utils/apiClient'
import { normalizeListResponse } from '@/utils/responseNormalizer'
import { executeWithRetry } from '@/utils/retryRequest'
import type { PaginatedResponse } from '@/types/api'
import type { ListApiConfig } from '@/components/WidgetRenderer/types'
import type {
  CredentialItem,
  CredentialDetail,
  CredentialCreatePayload,
  CredentialUpdatePayload,
} from '@/types/credential'
import type {
  TenantItem,
  TenantStatus,
  TenantCreatePayload,
  TenantUpdatePayload,
} from '@/types/tenant'

// ---- 数据/提交记录 ----

export {
  fetchDataList,
  fetchDataById,
  fetchMockData,
  fetchSubmissions,
  fetchSubmissionDetail,
  deleteSubmission,
  updateSubmissionStatus,
  batchDeleteSubmissions,
  batchUpdateSubmissionsStatus,
  exportSubmissionsCsv,
  exportSubmissions,
  fetchFlowInstances,
  fetchFlowInstanceById,
  fetchApprovalLogs,
  fetchLatestFlowVersion,
} from '@/utils/apiClient'

export type {
  FlowInstanceItem,
  ApprovalLogItem,
  FlowVersionItem,
  SubmissionItem,
  ExportFormat,
} from '@/utils/apiClient'

// ---- 凭据管理 ----

export async function fetchCredentials(params?: {
  page?: number
  pageSize?: number
  search?: string
  type?: string
}): Promise<PaginatedResponse<CredentialItem>> {
  const queryParams: Record<string, string> = {
    page: String(params?.page ?? 1),
    pageSize: String(params?.pageSize ?? 20),
  }
  if (params?.search) queryParams.search = params.search
  if (params?.type) queryParams.type = params.type
  return apiClient.get<PaginatedResponse<CredentialItem>>('/credentials', queryParams)
}

export async function fetchCredentialById(id: string): Promise<CredentialDetail> {
  return apiClient.get<CredentialDetail>(`/credentials/${encodeURIComponent(id)}`)
}

export async function createCredential(payload: CredentialCreatePayload): Promise<CredentialItem> {
  return apiClient.post<CredentialItem>('/credentials', payload)
}

export async function updateCredential(id: string, payload: CredentialUpdatePayload): Promise<CredentialItem> {
  return apiClient.put<CredentialItem>(`/credentials/${encodeURIComponent(id)}`, payload)
}

export async function deleteCredential(id: string): Promise<null> {
  return apiClient.delete<null>(`/credentials/${encodeURIComponent(id)}`)
}

// ---- 租户管理 ----

export async function fetchTenants(params?: {
  page?: number
  pageSize?: number
  search?: string
  status?: TenantStatus | ''
}): Promise<PaginatedResponse<TenantItem>> {
  const queryParams: Record<string, string> = {
    page: String(params?.page ?? 1),
    pageSize: String(params?.pageSize ?? 20),
  }
  if (params?.search) queryParams.search = params.search
  if (params?.status) queryParams.status = params.status
  return apiClient.get<PaginatedResponse<TenantItem>>('/tenants', queryParams)
}

export async function createTenant(payload: TenantCreatePayload): Promise<TenantItem> {
  return apiClient.post<TenantItem>('/tenants', payload)
}

export async function updateTenant(id: string, payload: TenantUpdatePayload): Promise<TenantItem> {
  return apiClient.put<TenantItem>(`/tenants/${encodeURIComponent(id)}`, payload)
}

export async function deleteTenant(id: string): Promise<null> {
  return apiClient.delete<null>(`/tenants/${encodeURIComponent(id)}`)
}

// ---- 通用列表查询 ----

/** 通用列表查询参数 */
export interface GenericListParams {
  /** 当前页码 */
  page: number
  /** 每页条数 */
  pageSize: number
  /** 搜索参数 */
  searchParams?: Record<string, unknown>
  /** 额外固定参数 */
  extraParams?: Record<string, unknown>
  /** 排序字段 */
  sortField?: string
  /** 排序方向 */
  sortOrder?: string
}

/** 通用列表查询结果 */
export interface GenericListResult {
  data: Record<string, unknown>[]
  total: number
}

/**
 * 通用列表查询 — 封装 requestUrl + normalizeListResponse + 重试
 *
 * 供 useListData 等 composable 调用，遵循 API 聚合规则。
 */
export async function fetchGenericList(
  listApi: ListApiConfig,
  params: GenericListParams,
  retryOptions?: { enableRetry?: boolean; maxRetries?: number },
): Promise<GenericListResult> {
  const requestParams: Record<string, unknown> = {
    [listApi.pageParam ?? 'pageNum']: params.page,
    [listApi.sizeParam ?? 'pageSize']: params.pageSize,
    ...filterEmptyParams(params.searchParams ?? {}),
    ...(params.extraParams ?? {}),
  }
  if (params.sortField) {
    requestParams.sortField = params.sortField
    requestParams.sortOrder = params.sortOrder
  }

  const method = listApi.method ?? 'post'
  const response: unknown = await executeWithRetry(
    () => apiClient.requestUrl(method, listApi.url, requestParams),
    retryOptions,
  )

  return normalizeListResponse(response, {
    dataPath: listApi.dataPath ?? 'data',
    totalPath: listApi.totalPath ?? 'total',
  })
}

/** 过滤空值参数 */
function filterEmptyParams(params: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      result[key] = value
    }
  }
  return result
}

// ---- Key 使用审计 ----

export interface KeyUsageLogItem {
  id: string
  tenantId: string
  keyId: string
  keyName: string
  workflowId: string | null
  workflowName: string | null
  endpoint: string
  method: string
  statusCode: number
  duration: number
  ip: string
  userAgent: string
  createdAt: string
}

export interface KeyUsageStatsByKey {
  keyId: string
  keyName: string
  totalRequests: number
  successRequests: number
  failedRequests: number
  avgDuration: number
  lastUsedAt: string | null
}

export interface KeyUsageStatsByWorkflow {
  workflowId: string
  workflowName: string
  keyId: string
  keyName: string
  totalRequests: number
  successRequests: number
  failedRequests: number
  avgDuration: number
  lastUsedAt: string | null
}

export async function fetchKeyUsageLogs(params?: {
  keyId?: string
  workflowId?: string
  startDate?: string
  endDate?: string
  page?: number
  pageSize?: number
}): Promise<PaginatedResponse<KeyUsageLogItem>> {
  const queryParams: Record<string, string> = {
    page: String(params?.page ?? 1),
    pageSize: String(params?.pageSize ?? 20),
  }
  if (params?.keyId) queryParams.keyId = params.keyId
  if (params?.workflowId) queryParams.workflowId = params.workflowId
  if (params?.startDate) queryParams.startDate = params.startDate
  if (params?.endDate) queryParams.endDate = params.endDate
  return apiClient.get<PaginatedResponse<KeyUsageLogItem>>('/key-usage', queryParams)
}

export async function fetchKeyUsageStatsByKey(params?: {
  startDate?: string
  endDate?: string
}): Promise<KeyUsageStatsByKey[]> {
  const queryParams: Record<string, string> = {}
  if (params?.startDate) queryParams.startDate = params.startDate
  if (params?.endDate) queryParams.endDate = params.endDate
  return apiClient.get<KeyUsageStatsByKey[]>('/key-usage/stats/by-key', queryParams)
}

export async function fetchKeyUsageStatsByWorkflow(params?: {
  keyId?: string
  startDate?: string
  endDate?: string
}): Promise<KeyUsageStatsByWorkflow[]> {
  const queryParams: Record<string, string> = {}
  if (params?.keyId) queryParams.keyId = params.keyId
  if (params?.startDate) queryParams.startDate = params.startDate
  if (params?.endDate) queryParams.endDate = params.endDate
  return apiClient.get<KeyUsageStatsByWorkflow[]>('/key-usage/stats/by-workflow', queryParams)
}

// ---- 流程操作 ----

/**
 * 发起流程实例
 *
 * @param definitionId - 流程定义 ID
 * @param variables - 流程变量
 */
export async function startFlow(
  definitionId: string,
  variables: Record<string, unknown> = {},
): Promise<unknown> {
  return apiClient.requestUrl<unknown>('post', '/flow-instances', {
    definitionId,
    variables,
  })
}

/**
 * 终止流程实例
 *
 * @param instanceId - 流程实例 ID
 * @param reason - 终止原因（可选）
 */
export async function terminateFlow(
  instanceId: string,
  reason?: string,
): Promise<unknown> {
  return apiClient.requestUrl<unknown>(
    'post',
    `/flow-instances/${instanceId}/terminate`,
    reason ? { reason } : undefined,
  )
}
