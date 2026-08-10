/**
 * 租户相关Type定义
 *
 * 与 packages/server 的 Tenant REST API 契约对齐
 */

/** 租户Status */
export type TenantStatus = "active" | "inactive" | "suspended";

/** 租户Config */
export interface TenantConfig {
  maxUsers: number;
  features: string[];
}

/** 租户Column表项 */
export interface TenantItem {
  id: string;
  name: string;
  code: string;
  status: TenantStatus;
  config: TenantConfig;
  createdAt: string;
  updatedAt: string;
}

/** 租户创建请求体 */
export interface TenantCreatePayload {
  name: string;
  code: string;
  status?: TenantStatus;
  config?: {
    maxUsers?: number;
    features?: string[];
  };
}

/** 租户Update请求体 */
export interface TenantUpdatePayload {
  name?: string;
  code?: string;
  status?: TenantStatus;
  config?: {
    maxUsers?: number;
    features?: string[];
  };
}
