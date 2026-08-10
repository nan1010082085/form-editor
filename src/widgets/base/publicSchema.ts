import type { SchemaType, Widget } from "./types";

/**
 * 公共Field工厂函数
 * 为所有 Widget 提供统一的Default value基底
 * 返回 Omit<Widget, 'name'>, 工厂函数补充 name 后即可满足 Widget Type
 */
export function publicSchema(
  id: string,
  type: SchemaType,
): Omit<Widget, "name"> {
  return {
    id,
    type,
    position: { x: 0, y: 0, w: 240, h: 40, zIndex: 1 },
    style: {},
    props: {},
    options: [],
    variables: [],
    events: [],
    validationRules: [],
  };
}

/**
 * 公共Style面板声明
 * 所有Component共享的可ConfigStyleProperty
 */
export const publicStylePanel = [
  "margin",
  "padding",
  "backgroundColor",
  "border",
  "borderRadius",
  "fontSize",
  "fontWeight",
  "color",
  "animationPreset",
  "animationDelay",
  "animationDuration",
] as const;
