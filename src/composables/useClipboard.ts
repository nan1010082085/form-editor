/**
 * useClipboard — 剪贴板Action composable
 *
 * 优先使用 navigator.clipboard API, 降级到 execCommand('copy')。
 * 自动passed ElMessage 给出Success/Failed反馈。
 */
import { ElMessage } from "element-plus";
import { tt } from "@/locales";

export function useClipboard() {
  /**
   * Copy文本到剪贴板
   * @param text 要Copy的文本
   * @param successMsg Success提示（默认已Copy）
   */
  async function copy(
    text: string,
    successMsg = tt("editor.common.copied"),
  ): Promise<boolean> {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
      } else {
        fallbackCopy(text);
      }
      ElMessage.success(successMsg);
      return true;
    } catch {
      try {
        fallbackCopy(text);
        ElMessage.success(successMsg);
        return true;
      } catch {
        ElMessage.error(tt("editor.common.copyFailed"));
        return false;
      }
    }
  }

  function fallbackCopy(text: string): void {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.cssText =
      "position:fixed;left:-9999px;top:-9999px;opacity:0";
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(textarea);
    if (!ok) throw new Error("execCommand copy failed");
  }

  return { copy };
}
