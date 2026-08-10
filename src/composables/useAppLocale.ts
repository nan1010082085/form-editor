/**
 * useAppLocale — Edit器界面Language（zh-CN / en-US）
 *
 * - 与 vue-i18n locale Sync
 * - localStorage 持久化（editor-locale）
 * - 提供 Element Plus Language包
 */
import { computed } from "vue";
import { useI18n } from "@schema-platform/platform-shared";
import zhCn from "element-plus/es/locale/lang/zh-cn";
import en from "element-plus/es/locale/lang/en";
import type { Language } from "element-plus/es/locale";
import {
  readStoredLocale,
  writeStoredLocale,
  type AppLocale,
} from "@/locales/localeStorage";

export type { AppLocale };
export { readStoredLocale };

/**
 * @returns locale Status、切换方法、Element Plus locale
 */
export function useAppLocale() {
  const { locale } = useI18n();

  const current = computed<AppLocale>(() =>
    locale.value === "en-US" ? "en-US" : "zh-CN",
  );

  /**
   * @param next - 目标Language
   */
  function setLocale(next: AppLocale): void {
    locale.value = next;
    writeStoredLocale(next);
  }

  /** 在中英文之间切换 */
  function toggleLocale(): void {
    setLocale(current.value === "zh-CN" ? "en-US" : "zh-CN");
  }

  const epLocale = computed<Language>(() =>
    current.value === "en-US" ? en : zhCn,
  );

  return {
    locale: current,
    setLocale,
    toggleLocale,
    epLocale,
  };
}
