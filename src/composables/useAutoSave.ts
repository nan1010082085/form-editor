/**
 * useAutoSave — 自动Save composable
 *
 * 当Edit器有未Save的更改Hrs, 自动定HrsSave。
 * 使用防抖机制：检测到脏Data后启动Countdown, Countdown内再次变脏则Reset计Hrs器。
 * 仅在Edit模式下生效。
 */
import { watch, onUnmounted, ref, type Ref } from "vue";
import { useEditorStore } from "@/stores/editor";

export interface AutoSaveOptions {
  /** 自动Save间隔（毫sec）, 默认 60000（60 sec） */
  delayMs?: number;
  /** 是否Enable自动Save（支持响应式 Ref） */
  enabled?: boolean | Ref<boolean>;
  /** 实际执RowSave的回调函数 */
  onSave: () => Promise<void>;
}

export function useAutoSave(options: AutoSaveOptions) {
  const { delayMs = 60_000, onSave } = options;
  const editorStore = useEditorStore();

  // 支持响应式 enabled
  const enabledRef =
    typeof options.enabled === "object" && "value" in options.enabled
      ? options.enabled
      : ref(options.enabled ?? true);

  const isAutoSaving = ref(false);
  let timer: ReturnType<typeof setTimeout> | null = null;

  function clearTimer() {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  }

  function scheduleSave() {
    clearTimer();
    if (!enabledRef.value) return;

    timer = setTimeout(async () => {
      if (!editorStore.isDirty) return;

      isAutoSaving.value = true;
      try {
        await onSave();
      } finally {
        isAutoSaving.value = false;
      }
    }, delayMs);
  }

  // 监听脏标记：变脏Hrs启动自动SaveCountdown, 变干净HrsCancel
  const stopDirtyWatch = watch(
    () => editorStore.isDirty,
    (dirty) => {
      if (dirty && enabledRef.value) {
        scheduleSave();
      } else {
        clearTimer();
      }
    },
    { immediate: true },
  );

  // 监听 enabled 变化：CloseHrsCancel定Hrs器, 开启Hrs如果脏则重新调度
  const stopEnabledWatch = watch(enabledRef, (val) => {
    if (!val) {
      clearTimer();
    } else if (editorStore.isDirty) {
      scheduleSave();
    }
  });

  function stop() {
    clearTimer();
    stopDirtyWatch();
    stopEnabledWatch();
  }

  onUnmounted(() => {
    clearTimer();
  });

  return {
    isAutoSaving,
    enabled: enabledRef,
    stop,
  };
}
