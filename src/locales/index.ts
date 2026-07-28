/**
 * 编辑器 i18n 单例
 *
 * 在 main.ts 通过 app.use(i18n) 安装到应用；同时导出实例供非 setup 上下文
 * （如 router 守卫）使用 i18n.global.t。模块级单例在 qiankun mount/unmount
 * 间复用，locale 状态稳定。
 */
import { createI18n } from "@schema-platform/platform-shared";
import editorZhCN from "./editor-zh-CN";
import editorEnUS from "./editor-en-US";

export const i18n = createI18n({
  messages: { "zh-CN": editorZhCN, "en-US": editorEnUS },
});

/**
 * 非 setup 上下文翻译入口（router 守卫等）
 *
 * vue-i18n v11 的 I18n.global 是 Composer | VueI18n 联合类型，
 * t 在联合上无法直接调用，此处收窄为统一签名。
 */
type TranslateFn = (key: string, named?: Record<string, unknown>) => string;

export function tt(key: string, named?: Record<string, unknown>): string {
  const t = i18n.global.t as TranslateFn;
  return t(key, named);
}
