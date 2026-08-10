/**
 * boardThemes — DashboardTheme预设
 *
 * 深色Theme + 动画Config, 供画布Property面板与Template使用。
 */
import type { CanvasConfig } from "@/widgets/base/types";

export interface BoardThemePreset {
  id: string;
  label: string;
  canvas: Partial<CanvasConfig>;
  cssVars?: Record<string, string>;
}

export const BOARD_THEME_PRESETS: BoardThemePreset[] = [
  {
    id: "default-light",
    label: "DefaultLight",
    canvas: {
      backgroundColor: "var(--bg-color-page)",
    },
  },
  {
    id: "dashboard-dark",
    label: "Dashboard Dark",
    canvas: {
      backgroundColor: "#0a1628",
    },
    cssVars: {
      "--grid-line-color": "rgba(255,255,255,0.06)",
      "--text-color-primary": "#e8eaed",
    },
  },
  {
    id: "dashboard-blue",
    label: "Tech Blue",
    canvas: {
      backgroundColor: "#0d1b2a",
    },
    cssVars: {
      "--grid-line-color": "rgba(64,158,255,0.12)",
      "--color-primary": "#409eff",
    },
  },
];

export type WidgetAnimationType = "none" | "fade-in" | "slide-up" | "scale-in";

export interface WidgetAnimationConfig {
  entrance?: WidgetAnimationType;
  duration?: number;
  dataTransition?: boolean;
}

export const DEFAULT_WIDGET_ANIMATION: WidgetAnimationConfig = {
  entrance: "fade-in",
  duration: 400,
  dataTransition: true,
};

export function applyBoardTheme(
  presetId: string,
): BoardThemePreset | undefined {
  return BOARD_THEME_PRESETS.find((p) => p.id === presetId);
}
