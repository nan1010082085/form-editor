/**
 * useLocale — 国际化翻译 composable
 *
 * 根据 FormGridLocale 返回翻译函数 t(key, params?)。
 * 支持Params插Value：t('confirmDelete', { name: 'Zhang San' }) -> 'ConfirmDeleteZhang San？'
 *
 * 插Value格式：{paramName}, 与 vue-i18n 保持一致。
 *
 * 接受 MaybeRef<FormGridLocale>, locale 变化Hrs t 函数自动切换Language包。
 */
import { computed, toValue, type MaybeRef } from "vue";
import type {
  FormGridLocale,
  TranslateFn,
} from "@/components/WidgetRenderer/types";
import zhCN from "@/locales/zh-CN";
import enUS from "@/locales/en-US";

/** Language包Map */
const localeMessages: Record<FormGridLocale, Record<string, string>> = {
  "zh-CN": zhCN,
  "en-US": enUS,
};

/**
 * 创建翻译函数
 *
 * @param locale - 当前Language（支持 ref / getter / 原始Value）
 * @returns t 翻译函数（响应式：locale 变化Hrs自动切换）
 */
export function useLocale(locale: MaybeRef<FormGridLocale>): {
  t: TranslateFn;
} {
  const messages = computed(() => localeMessages[toValue(locale)]);

  /**
   * 翻译函数
   * @param key - Message key（如 'table.emptyText'）
   * @param params - 插ValueParams（如 { label: 'Name' }）
   * @returns 翻译后的字符串, 找不到 key Hrs返回 key 本身
   */
  const t: TranslateFn = (
    key: string,
    params?: Record<string, unknown>,
  ): string => {
    let msg = messages.value[key] ?? key;
    if (params) {
      for (const [paramKey, paramVal] of Object.entries(params)) {
        msg = msg.replace(
          new RegExp(`\\{${paramKey}\\}`, "g"),
          String(paramVal ?? ""),
        );
      }
    }
    return msg;
  };

  return { t };
}
