/**
 * useIdGenerate — Component ID 与 VID 生成
 *
 * Component ID 格式: ComponentKey + 5位随机 Hash（如 input-A3xK9）
 * 生成Hrs机: 拖拽入画布瞬间, 永久不变
 */
import type { SchemaType } from "@/components/WidgetRenderer/types";
import { ID_HASH_LENGTH } from "./useConstant";

const ALPHABET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

/**
 * 生成Component唯一 ID
 * @example generateComponentId('input') // 'input-A3xK9'
 */
export function generateComponentId(componentKey: SchemaType): string {
  const hash = Array.from(
    { length: ID_HASH_LENGTH },
    () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)],
  ).join("");
  return `${componentKey}-${hash}`;
}

/**
 * 生成发布Version VID
 * @example generateVid() // 'vid-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
 */
export function generateVid(): string {
  return `vid-${crypto.randomUUID()}`;
}
