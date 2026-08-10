/**
 * Auth API — Authenticate相关接口
 *
 * Aggregate登录、登出、获取当前User等接口。
 * 底层委托 utils/apiClient。
 */
export { login, logout, fetchCurrentUser } from "@/utils/apiClient";

export type {
  LoginPayload,
  LoginResponse,
  CurrentUser,
} from "@/utils/apiClient";
