/**
 * useResponsivePosition — 响应式位置解析 composable
 *
 * 根据当前预览断点（desktop/tablet/mobile），解析 Widget 的响应式位置覆盖。
 * 仅在预览/发布模式下生效，编辑模式始终使用默认位置。
 *
 * 回退链：当前断点 → desktop → 默认 position
 */
import { computed, type ComputedRef, type Ref } from 'vue'
import type {
  Widget,
  PreviewBreakpoint,
  BreakpointPosition,
  ResponsivePosition,
} from '@/widgets/base/types'

/** 解析后的位置（完整字段，无 undefined） */
export interface ResolvedPosition {
  x: number
  y: number
  w: number
  h: number
  xUnit: 'px' | '%'
  yUnit: 'px' | '%'
  wUnit: 'px' | '%'
  hUnit: 'px' | '%'
  zIndex?: number
  hidden: boolean
}

/** 断点回退顺序：mobile → tablet → desktop */
const FALLBACK_ORDER: Record<PreviewBreakpoint, PreviewBreakpoint[]> = {
  mobile: ['mobile', 'tablet', 'desktop'],
  tablet: ['tablet', 'desktop'],
  desktop: ['desktop'],
}

/**
 * 从响应式配置中查找最匹配的断点覆盖
 */
function findBreakpointOverride(
  responsive: ResponsivePosition | undefined,
  breakpoint: PreviewBreakpoint,
): BreakpointPosition | undefined {
  if (!responsive) return undefined
  const fallbacks = FALLBACK_ORDER[breakpoint]
  for (const bp of fallbacks) {
    const override = responsive[bp]
    if (override) return override
  }
  return undefined
}

/**
 * 合并默认位置和断点覆盖
 */
function mergePosition(
  defaultPos: Widget['position'],
  override: BreakpointPosition | undefined,
): ResolvedPosition {
  const pos = defaultPos ?? { x: 0, y: 0, w: 240, h: 40 }
  if (!override) {
    return {
      x: pos.x,
      y: pos.y,
      w: pos.w,
      h: pos.h,
      xUnit: pos.xUnit ?? 'px',
      yUnit: pos.yUnit ?? 'px',
      wUnit: pos.wUnit ?? 'px',
      hUnit: pos.hUnit ?? 'px',
      zIndex: pos.zIndex,
      hidden: false,
    }
  }
  return {
    x: override.x ?? pos.x,
    y: override.y ?? pos.y,
    w: override.w ?? pos.w,
    h: override.h ?? pos.h,
    xUnit: override.xUnit ?? pos.xUnit ?? 'px',
    yUnit: override.yUnit ?? pos.yUnit ?? 'px',
    wUnit: override.wUnit ?? pos.wUnit ?? 'px',
    hUnit: override.hUnit ?? pos.hUnit ?? 'px',
    zIndex: override.zIndex ?? pos.zIndex,
    hidden: override.hidden ?? false,
  }
}

export interface UseResponsivePositionOptions {
  widget: Ref<Widget> | ComputedRef<Widget>
  breakpoint: Ref<PreviewBreakpoint>
  /** 是否为预览/发布模式（编辑模式忽略响应式覆盖） */
  isPreviewMode: Ref<boolean> | ComputedRef<boolean>
}

export interface UseResponsivePositionReturn {
  /** 解析后的位置（考虑断点覆盖和回退） */
  resolvedPosition: ComputedRef<ResolvedPosition>
}

/**
 * 根据当前断点解析 Widget 的响应式位置
 */
export function useResponsivePosition(
  options: UseResponsivePositionOptions,
): UseResponsivePositionReturn {
  const { widget, breakpoint, isPreviewMode } = options

  const resolvedPosition = computed<ResolvedPosition>(() => {
    if (!isPreviewMode.value) {
      // 编辑模式：直接使用默认位置，忽略响应式覆盖
      return mergePosition(widget.value.position, undefined)
    }
    const override = findBreakpointOverride(
      widget.value.responsivePosition,
      breakpoint.value,
    )
    return mergePosition(widget.value.position, override)
  })

  return { resolvedPosition }
}
