/**
 * Permission控制 Composable
 *
 * 从 useAppStore.userContext.permissions 获取当前User的Permission码Column表, 
 * 提供 hasPermission / hasAnyPermission / hasAllPermission 方法。
 *
 * @example
 * ```ts
 * const { hasPermission, hasAnyPermission } = usePermission()
 * if (hasPermission('flow:design')) { ... }
 * if (hasAnyPermission(['flow:design', 'flow:approve'])) { ... }
 * ```
 */
import { computed } from "vue";
import { useAppStore } from "@/stores/app";

export function usePermission() {
  const appStore = useAppStore();

  /** 当前User的Permission码Column表（响应式） */
  const permissions = computed(() => appStore.userContext.permissions ?? []);

  /**
   * 判断当前User是否拥有指定Permission码
   *
   * @param code - Permission码, 如 'flow:design'
   * @returns 是否拥有该Permission
   */
  function hasPermission(code: string): boolean {
    return permissions.value.includes(code);
  }

  /**
   * 判断当前User是否拥有任意一个Permission码（OR 逻辑）
   *
   * @param codes - Permission码数组
   * @returns 是否拥有至少一个Permission
   */
  function hasAnyPermission(codes: string[]): boolean {
    const userPerms = permissions.value;
    return codes.some((code) => userPerms.includes(code));
  }

  /**
   * 判断当前User是否拥有AllPermission码（AND 逻辑）
   *
   * @param codes - Permission码数组
   * @returns 是否拥有AllPermission
   */
  function hasAllPermission(codes: string[]): boolean {
    const userPerms = permissions.value;
    return codes.every((code) => userPerms.includes(code));
  }

  return {
    permissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermission,
  };
}
