/**
 * 界面Language localStorage 读写（供 i18n 启动与 useAppLocale 共用）
 */
export type AppLocale = "zh-CN" | "en-US";

export const LOCALE_STORAGE_KEY = "editor-locale";

/**
 * 读取本地持久化的Language（无 window / 非法ValueHrs回退 zh-CN）
 */
export function readStoredLocale(): AppLocale {
  if (typeof localStorage === "undefined") return "zh-CN";
  const saved = localStorage.getItem(LOCALE_STORAGE_KEY);
  return saved === "en-US" || saved === "zh-CN" ? saved : "zh-CN";
}

/**
 * @param locale - 目标Language
 */
export function writeStoredLocale(locale: AppLocale): void {
  localStorage.setItem(LOCALE_STORAGE_KEY, locale);
}
