/**
 * Form生命week期钩子 composable
 *
 * 支持四种钩子：
 * - onFormMount: Form挂载后Trigger（仅一次）
 * - onFieldChange: FieldValue变化HrsTrigger（300ms 防抖, 初始化阶段跳过）
 * - onBeforeSubmit: Submit前Validate, Back false 可阻止Submit
 * - onAfterLoad: Data回填完成后Trigger
 *
 * 设计要点：
 * 1. 钩子支持函数和字符串表达式两种模式（与 useLinkage 共享沙箱模式）
 * 2. onFieldChange 使用 300ms 防抖, 避免频繁Trigger
 * 3. 初始化阶段passed isInitialized flag 跳过 onFieldChange
 * 4. 所有钩子异常捕获并 console.error, 不阻塞Form主流程
 */
import { onMounted, onUnmounted, watch, ref } from "vue";
import type {
  FormLifecycleConfig,
  FormData,
} from "@/components/WidgetRenderer/types";
import { useLogger } from "@/composables/useLogger";

const logger = useLogger("Lifecycle");

/** 生命week期钩子Execute结果 */
export interface UseLifecycleReturn {
  /** Execute onBeforeSubmit 钩子, Back false 可阻止Submit */
  executeBeforeSubmit: () => Promise<boolean>;
  /** Execute onAfterLoad 钩子（loadApi 回填完成后调用） */
  executeAfterLoad: (data: FormData) => Promise<void>;
}

/**
 * 编译字符串表达式为可Execute函数
 * 沙箱限制：passed new Function 创建, 仅注入显式Params
 */
function compileExpression<T extends (...args: unknown[]) => unknown>(
  expression: string,
  paramNames: string[],
): T {
  try {
    return new Function(...paramNames, `"use strict"; ${expression}`) as T;
  } catch {
    logger.error(`Expression compilation failed: "${expression}"`);
    return (() => {}) as unknown as T;
  }
}

/**
 * 安全Execute钩子 — 统一处理函数/表达式两种模式和异常捕获
 *
 * @param hook - 钩子Config（函数or字符串表达式）
 * @param args - 传递给钩子的Params
 * @param paramNames - 字符串表达式的Params名Column表
 * @returns 钩子BackValue（onBeforeSubmit 场景需要 boolean）
 */
async function executeHook<R = void>(
  hook: ((...args: unknown[]) => R | Promise<R>) | string | undefined,
  args: unknown[],
  paramNames: string[],
): Promise<R | undefined> {
  if (!hook) return undefined;

  try {
    let fn: (...args: unknown[]) => R | Promise<R>;
    if (typeof hook === "function") {
      fn = hook;
    } else {
      fn = compileExpression<typeof fn>(hook, paramNames);
    }
    return await fn(...args);
  } catch (err) {
    logger.error("Hook execution error:", err);
    return undefined;
  }
}

/**
 * useLifecycle composable
 *
 * @param lifecycle - 生命week期钩子Config（可选, 无ConfigHrs所有Action为空Action）
 * @param formData - 响应式FormData
 * @returns 钩子Execute方法
 */
export function useLifecycle(
  lifecycle: FormLifecycleConfig | undefined,
  formData: FormData,
): UseLifecycleReturn {
  // 初始化标记：onMounted 完成前的 watch 不Trigger onFieldChange
  const isInitialized = ref(false);

  // ---- onFormMount: 挂载后Trigger一次 ----
  onMounted(async () => {
    if (lifecycle?.onFormMount) {
      await executeHook(
        lifecycle.onFormMount as
          | ((...args: unknown[]) => unknown)
          | string
          | undefined,
        [formData],
        ["formData"],
      );
    }
    // 标记初始化完成, 后续Field变化才Trigger onFieldChange
    isInitialized.value = true;
  });

  // ---- onFieldChange: 深度监听 formData, 300ms 防抖 ----
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  if (lifecycle?.onFieldChange) {
    watch(
      () => formData,
      (newData, oldData) => {
        // 初始化阶段跳过
        if (!isInitialized.value) return;

        // 找出变化的Field
        const allKeys = new Set([
          ...Object.keys(newData),
          ...(oldData ? Object.keys(oldData) : []),
        ]);

        for (const key of allKeys) {
          if (newData[key] !== oldData?.[key]) {
            // 防抖：清除上一个定Hrs器, Settings新的 300ms 延迟
            if (debounceTimer) {
              clearTimeout(debounceTimer);
            }
            debounceTimer = setTimeout(() => {
              executeHook(
                lifecycle.onFieldChange! as
                  | ((...args: unknown[]) => unknown)
                  | string,
                [key, newData[key], newData],
                ["field", "value", "formData"],
              );
            }, 300);
            // 只Trigger一次（取第一个变化的Field）, 防抖合并后续变化
            break;
          }
        }
      },
      { deep: true },
    );
  }

  // ---- Component卸载Hrs清理防抖定Hrs器 ----
  onUnmounted(() => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }
  });

  // ---- onBeforeSubmit: Submit前Validate ----
  async function executeBeforeSubmit(): Promise<boolean> {
    if (!lifecycle?.onBeforeSubmit) return true;
    const result = await executeHook<boolean>(
      lifecycle.onBeforeSubmit as
        | ((...args: unknown[]) => boolean | Promise<boolean>)
        | string
        | undefined,
      [formData],
      ["formData"],
    );
    // 未定义or异常HrsDefault允许Submit
    return result !== false;
  }

  // ---- onAfterLoad: Data回填完成后 ----
  async function executeAfterLoad(data: FormData): Promise<void> {
    if (lifecycle?.onAfterLoad) {
      await executeHook(
        lifecycle.onAfterLoad as
          | ((...args: unknown[]) => unknown)
          | string
          | undefined,
        [data],
        ["formData"],
      );
    }
  }

  return {
    executeBeforeSubmit,
    executeAfterLoad,
  };
}
