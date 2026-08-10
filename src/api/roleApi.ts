/**
 * Role API — Role管理相关接口
 *
 * AggregateRole CRUD、PermissionMin配等接口。
 * 底层委托 utils/apiClient（baseUrl 已含 `/api`, 路径勿再加前缀）。
 */
import { apiClient } from "@/utils/apiClient";

/** RoleColumn表项（平台 toJSON 主键为 `id`） */
export interface RoleItem {
  id: string;
  name: string;
  description?: string;
  permissions: string[];
  data_scope: "all" | "dept" | "self" | "custom";
  dept_ids: string[];
  createdAt: string;
  updatedAt: string;
}

/** Permission项 */
export interface PermissionItem {
  id: string;
  code: string;
  name: string;
  module: string;
  description?: string;
}

/** Min页响应 */
export interface RoleListResponse {
  items: RoleItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/** 创建RoleParams */
export interface CreateRolePayload {
  name: string;
  description?: string;
  permissions?: string[];
  data_scope?: "all" | "dept" | "self" | "custom";
  dept_ids?: string[];
}

/** UpdateRoleParams */
export interface UpdateRolePayload {
  name?: string;
  description?: string;
  permissions?: string[];
  data_scope?: "all" | "dept" | "self" | "custom";
  dept_ids?: string[];
}

/** 获取RoleColumn表 */
export function fetchRoles(
  params: {
    q?: string;
    page?: number;
    pageSize?: string;
  } = {},
): Promise<RoleListResponse> {
  return apiClient.get("/roles", params as Record<string, unknown>);
}

/** 获取单个Role */
export function fetchRoleById(id: string): Promise<RoleItem> {
  return apiClient.get(`/roles/${encodeURIComponent(id)}`);
}

/** 创建Role */
export function createRole(payload: CreateRolePayload): Promise<RoleItem> {
  return apiClient.post("/roles", payload);
}

/** UpdateRole */
export function updateRole(
  id: string,
  payload: UpdateRolePayload,
): Promise<RoleItem> {
  return apiClient.put(`/roles/${encodeURIComponent(id)}`, payload);
}

/** DeleteRole */
export function deleteRole(id: string): Promise<null> {
  return apiClient.delete(`/roles/${encodeURIComponent(id)}`);
}

/** PermissionColumn表Min页响应 */
export interface PermissionListResponse {
  items: PermissionItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/** 获取可用PermissionColumn表 */
export async function fetchPermissions(): Promise<PermissionItem[]> {
  const response = await apiClient.get<PermissionListResponse>(
    "/roles/permissions",
  );
  return response.items;
}
