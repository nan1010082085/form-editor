import { onMounted, onUnmounted, watch, type Ref } from 'vue'

/** E-09 — 大屏/看板数据定时刷新（秒，0 或未设置则关闭） */
export function useWidgetAutoRefresh(
  tick: () => void | Promise<void>,
  intervalSeconds: Ref<number>,
) {
  let timer: ReturnType<typeof setInterval> | null = null

  function clearTimer() {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
  }

  function armTimer() {
    clearTimer()
    const sec = intervalSeconds.value
    if (!Number.isFinite(sec) || sec <= 0) return
    timer = setInterval(() => {
      void tick()
    }, sec * 1000)
  }

  onMounted(armTimer)
  onUnmounted(clearTimer)
  watch(intervalSeconds, armTimer)
}
