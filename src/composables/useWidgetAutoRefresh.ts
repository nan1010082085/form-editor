import { onMounted, onUnmounted, watch, type Ref } from "vue";

/** E-09 — Dashboard/KanbanData定HrsRefresh（sec, 0 或未Settings则Close） */
export function useWidgetAutoRefresh(
  tick: () => void | Promise<void>,
  intervalSeconds: Ref<number>,
) {
  let timer: ReturnType<typeof setInterval> | null = null;

  function clearTimer() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  function armTimer() {
    clearTimer();
    const sec = intervalSeconds.value;
    if (!Number.isFinite(sec) || sec <= 0) return;
    timer = setInterval(() => {
      void tick();
    }, sec * 1000);
  }

  onMounted(armTimer);
  onUnmounted(clearTimer);
  watch(intervalSeconds, armTimer);
}
