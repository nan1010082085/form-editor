/**
 * useEditorStore — 编辑器交互状态
 *
 * 职责：
 * - 选中状态（单选/多选）
 * - 编辑器模式（edit/preview/publish-interactive/publish-readonly）
 * - 撤销/重做历史（immer patches，主画布 + 弹窗编辑器）
 * - 剪贴板
 * - 弹窗编辑器状态
 */
import { defineStore } from 'pinia'
import { ref, computed, shallowRef } from 'vue'
import { produce, enablePatches, applyPatches, type Patch } from 'immer'
import type { Widget } from '../widgets/base/types'
import type { InteractionMode } from '../composables/useConstant'
import { useWidgetStore } from './widget'
import { MAX_HISTORY_SIZE } from '../composables/useConstant'

enablePatches()

const MAX_HISTORY = MAX_HISTORY_SIZE

interface HistoryEntry {
  patches: Patch[]
  inversePatches: Patch[]
}

function cloneWidgets(widgets: Widget[]): Widget[] {
  return produce(widgets, () => {}) as Widget[]
}

export const useEditorStore = defineStore('editor', () => {
  const selectedId = ref<string | null>(null)
  const selectedIds = ref<string[]>([])

  const mode = ref<InteractionMode>('edit')

  const showZoomIndicator = ref(true)
  function toggleZoomIndicator() {
    showZoomIndicator.value = !showZoomIndicator.value
  }

  const baseState = shallowRef<Widget[]>([])
  const history = shallowRef<HistoryEntry[]>([])
  const historyIndex = ref(-1)

  const canUndo = computed(() => historyIndex.value > 0)
  const canRedo = computed(() => historyIndex.value < history.value.length - 1)

  const editingDialogId = ref<string | null>(null)
  const dialogBaseState = shallowRef<Widget[]>([])
  const dialogHistory = shallowRef<HistoryEntry[]>([])
  const dialogHistoryIndex = ref(-1)

  const canUndoDialog = computed(() => dialogHistoryIndex.value > 0)
  const canRedoDialog = computed(
    () => dialogHistoryIndex.value < dialogHistory.value.length - 1,
  )

  const clipboard = ref<Widget | null>(null)

  const isDirty = ref(false)
  const savedHistoryIndex = ref(-1)

  function markDirty(): void {
    isDirty.value = true
  }

  function markClean(): void {
    isDirty.value = false
    savedHistoryIndex.value = historyIndex.value
  }

  type ConfigDialogType = 'events' | 'rules' | 'linkages' | 'api' | 'variables'
  const configDialogTrigger = ref<{ widget: Widget; type: ConfigDialogType } | null>(null)

  function openConfigDialog(widget: Widget, type: ConfigDialogType) {
    configDialogTrigger.value = { widget, type }
  }

  function clearConfigDialogTrigger() {
    configDialogTrigger.value = null
  }

  function select(id: string | null): void {
    selectedId.value = id
    selectedIds.value = id ? [id] : []
  }

  function toggleSelect(id: string): void {
    const idx = selectedIds.value.indexOf(id)
    if (idx >= 0) {
      selectedIds.value.splice(idx, 1)
      selectedId.value = selectedIds.value[selectedIds.value.length - 1] ?? null
    } else {
      selectedIds.value.push(id)
      selectedId.value = id
    }
  }

  function clearSelection(): void {
    selectedId.value = null
    selectedIds.value = []
  }

  function getStateAt(index: number, entries: HistoryEntry[], base: Widget[]): Widget[] {
    let state = base
    for (let i = 1; i <= index; i++) {
      state = applyPatches(state, entries[i].patches)
    }
    return state
  }

  function resetHistory(widgets: Widget[]): void {
    baseState.value = cloneWidgets(widgets)
    history.value = [{ patches: [], inversePatches: [] }]
    historyIndex.value = 0
    savedHistoryIndex.value = 0
    isDirty.value = false
  }

  function pushHistory(widgets: Widget[]): void {
    if (historyIndex.value < 0) {
      resetHistory(widgets)
      markDirty()
      return
    }

    const current = getStateAt(historyIndex.value, history.value, baseState.value)

    let entry: HistoryEntry = { patches: [], inversePatches: [] }
    produce(
      current,
      () => widgets,
      (patches, inversePatches) => {
        entry = { patches, inversePatches }
      },
    )

    if (entry.patches.length === 0) return

    let newHistory = history.value.slice(0, historyIndex.value + 1)
    newHistory.push(entry)
    if (newHistory.length > MAX_HISTORY + 1) {
      const removed = newHistory.length - (MAX_HISTORY + 1)
      baseState.value = getStateAt(removed, newHistory, baseState.value)
      newHistory = [{ patches: [], inversePatches: [] }, ...newHistory.slice(removed + 1)]
      historyIndex.value -= removed
      if (savedHistoryIndex.value >= 0) {
        savedHistoryIndex.value = Math.max(0, savedHistoryIndex.value - removed)
      }
    }
    history.value = newHistory
    historyIndex.value = newHistory.length - 1
    markDirty()
  }

  function undo(): Widget[] | null {
    if (historyIndex.value <= 0) return null
    const current = getStateAt(historyIndex.value, history.value, baseState.value)
    const entry = history.value[historyIndex.value]
    historyIndex.value--
    isDirty.value = historyIndex.value !== savedHistoryIndex.value
    return applyPatches(current, entry.inversePatches)
  }

  function redo(): Widget[] | null {
    if (historyIndex.value >= history.value.length - 1) return null
    historyIndex.value++
    isDirty.value = historyIndex.value !== savedHistoryIndex.value
    return cloneWidgets(getStateAt(historyIndex.value, history.value, baseState.value))
  }

  function copy(widget: Widget): void {
    clipboard.value = cloneWidgets([widget])[0]
  }

  function paste(): Widget | null {
    if (!clipboard.value) return null
    return cloneWidgets([clipboard.value])[0]
  }

  function setMode(newMode: InteractionMode): void {
    mode.value = newMode
  }

  function openDialogEditor(id: string): void {
    editingDialogId.value = id
    dialogBaseState.value = []
    dialogHistory.value = []
    dialogHistoryIndex.value = -1
  }

  function closeDialogEditor(): void {
    editingDialogId.value = null
    dialogBaseState.value = []
    dialogHistory.value = []
    dialogHistoryIndex.value = -1
  }

  function pushDialogHistory(widgets: Widget[]): void {
    const current = dialogHistoryIndex.value < 0
      ? widgets
      : getStateAt(dialogHistoryIndex.value, dialogHistory.value, dialogBaseState.value)

    let entry: HistoryEntry = { patches: [], inversePatches: [] }
    produce(current, () => widgets, (patches, inversePatches) => {
      entry = { patches, inversePatches }
    })

    if (dialogHistoryIndex.value < 0) {
      dialogBaseState.value = cloneWidgets(current)
      dialogHistory.value = [{ patches: [], inversePatches: [] }, entry]
      dialogHistoryIndex.value = 1
    } else {
      let newHistory = dialogHistory.value.slice(0, dialogHistoryIndex.value + 1)
      newHistory.push(entry)
      if (newHistory.length > MAX_HISTORY + 1) {
        const removed = newHistory.length - (MAX_HISTORY + 1)
        dialogBaseState.value = getStateAt(removed, newHistory, dialogBaseState.value)
        newHistory = [{ patches: [], inversePatches: [] }, ...newHistory.slice(removed + 1)]
        dialogHistoryIndex.value -= removed
      }
      dialogHistory.value = newHistory
      dialogHistoryIndex.value = newHistory.length - 1
    }
  }

  function undoDialog(): Widget[] | null {
    if (dialogHistoryIndex.value <= 0) return null
    const current = getStateAt(dialogHistoryIndex.value, dialogHistory.value, dialogBaseState.value)
    const entry = dialogHistory.value[dialogHistoryIndex.value]
    dialogHistoryIndex.value--
    return applyPatches(current, entry.inversePatches)
  }

  function redoDialog(): Widget[] | null {
    if (dialogHistoryIndex.value >= dialogHistory.value.length - 1) return null
    dialogHistoryIndex.value++
    return cloneWidgets(getStateAt(dialogHistoryIndex.value, dialogHistory.value, dialogBaseState.value))
  }

  function performUndo(): void {
    const widgetStore = useWidgetStore()
    const snapshot = undo()
    if (snapshot) widgetStore.widgets = snapshot
  }

  function performRedo(): void {
    const widgetStore = useWidgetStore()
    const snapshot = redo()
    if (snapshot) widgetStore.widgets = snapshot
  }

  function performCopyWidget(): void {
    const widgetStore = useWidgetStore()
    const widget = widgetStore.findWidget(selectedId.value ?? '')
    if (widget) copy(widget)
  }

  function performDeleteWidget(): void {
    if (!selectedId.value) return
    const widgetStore = useWidgetStore()
    widgetStore.removeWidget(selectedId.value)
    clearSelection()
    pushHistory([...widgetStore.widgets])
  }

  return {
    selectedId,
    selectedIds,
    mode,
    showZoomIndicator,
    toggleZoomIndicator,
    history,
    historyIndex,
    canUndo,
    canRedo,
    editingDialogId,
    dialogHistory,
    dialogHistoryIndex,
    canUndoDialog,
    canRedoDialog,
    clipboard,
    isDirty,
    markDirty,
    markClean,
    configDialogTrigger,
    openConfigDialog,
    clearConfigDialogTrigger,
    select,
    toggleSelect,
    clearSelection,
    resetHistory,
    pushHistory,
    undo,
    redo,
    copy,
    paste,
    setMode,
    openDialogEditor,
    closeDialogEditor,
    pushDialogHistory,
    undoDialog,
    redoDialog,
    performUndo,
    performRedo,
    performCopyWidget,
    performDeleteWidget,
  }
})
