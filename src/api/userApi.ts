/**
 * User API — User管理相关接口
 *
 * AggregateUser CRUD、Reset密码等接口。
 * 底层委托 utils/apiClient（baseUrl 已含 `/api`, 路径勿再加前缀）。
 */
import { apiClient } from "@/utils/apiClient";

/** UserColumn表项（平台 toJSON 主键为 `id`） */
export interface UserItem {
  id: string;
  username: string;
  displayName: string;
  roles: string[];
  tenantId: string;
  deptId?: string;
  email?: string;
  phone?: string;
  avatar?: string;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
}

/** Min页响应 */
export interface UserListResponse {
  items: UserItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/** 创建UserParams */
export interface CreateUserPayload {
  username: string;
  password: string;
  displayName: string;
  phone?: string;
  email?: string;
  deptId?: string;
  status?: "active" | "inactive";
  roles?: string[];
}

/** UpdateUserParams */
export interface UpdateUserPayload {
  displayName?: string;
  phone?: string;
  email?: string;
  deptId?: string;
  status?: "active" | "inactive";
  roles?: string[];
}

/** 获取UserColumn表 */
export function fetchUsers(
  params: {
    q?: string;
    page?: number;
    pageSize?: string;
    status?: string;
    deptId?: string;
  } = {},
): Promise<UserListResponse> {
  return apiClient.get("/users", params as Record<string, unknown>);
}

/** 获取单个User */
export function fetchUserById(id: string): Promise<UserItem> {
  return apiClient.get(`/users/${encodeURIComponent(id)}`);
}

/** 创建User */
export function createUser(payload: CreateUserPayload): Promise<UserItem> {
  return apiClient.post("/users", payload);
}

/** UpdateUser */
export function updateUser(
  id: string,
  payload: UpdateUserPayload,
): Promise<UserItem> {
  return apiClient.put(`/users/${encodeURIComponent(id)}`, payload);
}

/** DeleteUser */
export function deleteUser(id: string): Promise<null> {
  return apiClient.delete(`/users/${encodeURIComponent(id)}`);
}

/** ResetUser密码 */
export function resetUserPassword(
  id: string,
  password: string,
): Promise<null> {
  return apiClient.put(`/users/${encodeURIComponent(id)}/password`, {
    password,
  });
}
