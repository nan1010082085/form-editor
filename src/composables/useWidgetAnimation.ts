/**
 * useWidgetAnimation — Widget 入场动画 composable
 *
 * 从 widget.style 读取动画配置，返回可绑定的 CSS style。
 * 仅在 preview/publish 模式下生效，编辑模式下不应用动画。
 */
import { computed, type ComputedRef } from 'vue'
import { getAnimationStyle } from '@/utils/widgetAnimations'

interface WidgetAnimationConfig {
  animationPreset?: string
  animationDelay?: number
  animationDuration?: number
}

/**
 * @param widgetStyle widget.style 的响应式引用
 * @param isPreviewOrPublish 是否处于预览/发布模式（非编辑模式）
 */
export function useWidgetAnimation(
  widgetStyle: ComputedRef<Record<string, unknown>>,
  isPreviewOrPublish: ComputedRef<boolean>,
) {
  const animationStyle = computed(() => {
    if (!isPreviewOrPublish.value) return ''

    const style = widgetStyle.value
    const config: WidgetAnimationConfig = {
      animationPreset: style.animationPreset as string | undefined,
      animationDelay: style.animationDelay as number | undefined,
      animationDuration: style.animationDuration as number | undefined,
    }

    return getAnimationStyle(config.animationPreset, config.animationDelay, config.animationDuration)
  })

  return { animationStyle }
}
