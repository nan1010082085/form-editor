/**
 * widgetAnimations — Widget 入场动画预设
 *
 * 仅使用 opacity / transform, 不影响Layout。
 * 所有动画passed CSS @keyframes 实现, JS 层只负责ConfigMap。
 */

export interface AnimationPreset {
  name: string;
  label: string;
  /** 纯 CSS animation PropertyValue（不含 @keyframes 定义） */
  css: string;
}

export const ANIMATION_PRESETS: Record<string, AnimationPreset> = {
  none: { name: "none", label: "None", css: "" },
  fadeIn: {
    name: "fadeIn",
    label: "Fade In",
    css: "animation: widgetFadeIn 0.6s ease-out forwards;",
  },
  slideUp: {
    name: "slideUp",
    label: "Slide Up",
    css: "animation: widgetSlideUp 0.6s ease-out forwards;",
  },
  slideDown: {
    name: "slideDown",
    label: "Slide Down",
    css: "animation: widgetSlideDown 0.6s ease-out forwards;",
  },
  slideLeft: {
    name: "slideLeft",
    label: "Slide Left",
    css: "animation: widgetSlideLeft 0.6s ease-out forwards;",
  },
  slideRight: {
    name: "slideRight",
    label: "Slide Right",
    css: "animation: widgetSlideRight 0.6s ease-out forwards;",
  },
  scaleIn: {
    name: "scaleIn",
    label: "Scale In",
    css: "animation: widgetScaleIn 0.5s ease-out forwards;",
  },
  bounceIn: {
    name: "bounceIn",
    label: "Bounce In",
    css: "animation: widgetBounceIn 0.8s ease-out forwards;",
  },
  rotateIn: {
    name: "rotateIn",
    label: "Rotate In",
    css: "animation: widgetRotateIn 0.6s ease-out forwards;",
  },
};

/** 动画预设OptionsColumn表（英文 fallback, 供非 i18n 场景） */
export const ANIMATION_OPTIONS = Object.values(ANIMATION_PRESETS).map((p) => ({
  label: p.label,
  value: p.name,
}));

/**
 * 获取本地化动画预设Options
 *
 * @param t - i18n 翻译函数
 */
export function getAnimationOptions(
  t: (key: string) => string,
): { label: string; value: string }[] {
  return Object.values(ANIMATION_PRESETS).map((p) => {
    const key = `editor.animationPresets.${p.name}`;
    const translated = t(key);
    return {
      label: translated === key ? p.label : translated,
      value: p.name,
    };
  });
}

/**
 * @keyframes 定义 — 注入到全局Style表
 * 仅使用 opacity / transform, 不影响文档流
 */
export const ANIMATION_KEYFRAMES = `
@keyframes widgetFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes widgetSlideUp {
  from { opacity: 0; transform: translateY(24px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes widgetSlideDown {
  from { opacity: 0; transform: translateY(-24px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes widgetSlideLeft {
  from { opacity: 0; transform: translateX(24px); }
  to { opacity: 1; transform: translateX(0); }
}

@keyframes widgetSlideRight {
  from { opacity: 0; transform: translateX(-24px); }
  to { opacity: 1; transform: translateX(0); }
}

@keyframes widgetScaleIn {
  from { opacity: 0; transform: scale(0.85); }
  to { opacity: 1; transform: scale(1); }
}

@keyframes widgetBounceIn {
  0% { opacity: 0; transform: scale(0.3); }
  50% { opacity: 1; transform: scale(1.05); }
  70% { transform: scale(0.95); }
  100% { opacity: 1; transform: scale(1); }
}

@keyframes widgetRotateIn {
  from { opacity: 0; transform: rotate(-10deg) scale(0.9); }
  to { opacity: 1; transform: rotate(0deg) scale(1); }
}
`;

/**
 * 获取动画的 CSS 内联Style字符串
 * @param presetName 预设Name
 * @param delay 延迟毫sec数
 * @param duration 自定义持续Hrs间毫sec数（可选, 覆盖预设Default value）
 */
export function getAnimationStyle(
  presetName: string | undefined,
  delay: number | undefined,
  duration: number | undefined,
): string {
  if (!presetName || presetName === "none") return "";
  const preset = ANIMATION_PRESETS[presetName];
  if (!preset || !preset.css) return "";

  let css = preset.css;

  if (delay && delay > 0) {
    css += ` animation-delay: ${delay}ms;`;
  }

  if (duration && duration > 0) {
    css += ` animation-duration: ${duration}ms;`;
  }

  return css;
}
