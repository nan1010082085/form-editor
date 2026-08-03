import { computed, type Ref } from "vue";
import { useWidgetStore } from "@/stores/widget";
import { useGridDropZone } from "./useGridDropZone";

export function useGridCanvasDropEnabled(
  containerRef: Ref<HTMLElement | null>,
  enabled: Ref<boolean>,
) {
  const widgetStore = useWidgetStore();

  const zone = useGridDropZone(
    containerRef,
    () => null,
    () => widgetStore.widgets,
    () => enabled.value,
  );

  return {
    ...zone,
    isDragOver: computed(() => enabled.value && zone.isDragOver.value),
  };
}
