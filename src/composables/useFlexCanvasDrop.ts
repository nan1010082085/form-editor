import { computed, type Ref } from 'vue'
import { useWidgetStore } from '@/stores/widget'
import { useFlexDropZone } from './useFlexDropZone'

/** 画布根级 flex 拖放（parentId = null） */
export function useFlexCanvasDrop(containerRef: Ref<HTMLElement | null>) {
  const widgetStore = useWidgetStore()

  return useFlexDropZone(
    containerRef,
    () => null,
    () => widgetStore.widgets,
    () => true,
  )
}

export function useFlexCanvasDropEnabled(
  containerRef: Ref<HTMLElement | null>,
  enabled: Ref<boolean>,
) {
  const widgetStore = useWidgetStore()

  const zone = useFlexDropZone(
    containerRef,
    () => null,
    () => widgetStore.widgets,
    () => enabled.value,
  )

  return {
    ...zone,
    isDragOver: computed(() => enabled.value && zone.isDragOver.value),
  }
}
