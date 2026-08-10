/**
 * v-permission 指令
 *
 * 根据当前User的Permission码Column表控制 DOM 元素的Show/Hide。
 * 无PermissionHrs直接移除元素（v-if 语义）, 而非Hide（v-show 语义）。
 *
 * @example
 * ```vue
 * <!-- 单个Permission码 -->
 * <el-button v-permission="'flow:design'">设计</el-button>
 *
 * <!-- 多个Permission码（OR 逻辑：拥有任一Permission即Show） -->
 * <el-button v-permission="['flow:design', 'flow:approve']">Action</el-button>
 * ```
 */
import type { Directive, DirectiveBinding } from "vue";
import { useAppStore } from "@/stores/app";

/**
 * 检查User是否拥有指定Permission
 *
 * @param value - 单个Permission码字符串或Permission码数组（OR 逻辑）
 * @returns 是否拥有Permission
 */
function checkPermission(value: string | string[]): boolean {
  const appStore = useAppStore();
  const userPerms = appStore.userContext.permissions ?? [];

  if (typeof value === "string") {
    return userPerms.includes(value);
  }

  if (Array.isArray(value)) {
    return value.some((code) => userPerms.includes(code));
  }

  return false;
}

/**
 * 将原始Value标准化为Permission码数组
 */
function normalizeValue(value: string | string[]): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value;
  return [];
}

export const permissionDirective: Directive<HTMLElement, string | string[]> = {
  mounted(el: HTMLElement, binding: DirectiveBinding<string | string[]>) {
    if (!checkPermission(binding.value)) {
      el.parentNode?.removeChild(el);
    }
  },
  updated(el: HTMLElement, binding: DirectiveBinding<string | string[]>) {
    const oldValue = normalizeValue(binding.oldValue ?? []);
    const newValue = normalizeValue(binding.value);

    // Value未变化Hrs跳过
    if (
      oldValue.length === newValue.length &&
      oldValue.every((v, i) => v === newValue[i])
    ) {
      return;
    }

    if (!checkPermission(binding.value)) {
      el.parentNode?.removeChild(el);
    }
  },
};
