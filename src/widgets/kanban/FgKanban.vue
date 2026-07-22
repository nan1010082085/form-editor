<script setup lang="ts">
/** E-06 — Kanban 看板：列拖拽 + 状态 API 更新 */
import { inject, computed, ref, onMounted } from 'vue'
import { widgetDataKey } from '../base/types'
import { useExposeWidget } from '../../composables/useExposeWidget'
import { fetchWidgetDataSource } from '@/api/widgetApi'
import { apiClient } from '@/utils/apiClient'
import { resolveWidgetUrl } from '@/utils/resolveWidgetUrl'
import { useWidgetData } from '@/composables/useWidgetData'
import WidgetStateShell from '../../components/WidgetRenderer/WidgetStateShell.vue'
import type { KanbanColumn } from './config'
import { groupCardsByStatus } from './kanbanUtils'
import { kanbanMockRows } from './mock'
import { WIDGET_SURFACE_KEY, shouldUseWidgetMock } from '../base/widgetMock'
import styles from './style.module.scss'

const widgetData = inject(widgetDataKey)!
const surface = inject(WIDGET_SURFACE_KEY, 'runtime')

// ---- useWidgetData（重试/SWR/去重） ----
const api = computed(() => widgetData.value.api)
const apiUrl = computed(() => api.value?.url ? resolveWidgetUrl(`${api.value.url}?page=1&pageSize=100`, {}) : '')

function normalizeList(raw: unknown): Record<string, unknown>[] {
  if (Array.isArray(raw)) return raw as Record<string, unknown>[]
  if (raw && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>
    if (Array.isArray(obj.items)) return obj.items as Record<string, unknown>[]
  }
  return []
}

const { data: rawData, loading, error, reload: wReload } = useWidgetData<Record<string, unknown>[]>({
  key: 'kanban:' + apiUrl.value,
  fetcher: () => fetchWidgetDataSource<unknown>(apiUrl.value).then(normalizeList),
  enabled: computed(() => !!apiUrl.value && !shouldUseWidgetMock(surface, Boolean(apiUrl.value))),
  retry: 2,
  swr: false,
  cacheTtl: 0,
  autoLoad: false,
})

const cards = computed(() => rawData.value ?? [])

// ---- 加载（mock 或 API） ----
function loadCards() {
  const hasApi = Boolean(api.value?.url)
  if (shouldUseWidgetMock(surface, hasApi)) {
    // mock 场景：直接注入，不走 useWidgetData
    rawData.value = kanbanMockRows
    return
  }
  if (hasApi) void wReload()
}

onMounted(() => loadCards())

function cardId(card: Record<string, unknown>): string {
  return String(card.id ?? card._id ?? '')
}

function buildUpdateUrl(card: Record<string, unknown>): string | null {
  const pattern = widgetData.value.props?.updateUrl as string | undefined
  if (pattern) {
    return pattern
      .replace('{{id}}', cardId(card))
      .replace('{{cardId}}', cardId(card))
  }
  const listUrl = widgetData.value.api?.url
  if (!listUrl) return null
  const base = listUrl.replace(/\/$/, '')
  return `${base}/${cardId(card)}`
}

async function moveCard(card: Record<string, unknown>, col: KanbanColumn) {
  const current = String(card[statusField.value] ?? '')
  if (current === col.status) return

  const url = buildUpdateUrl(card)
  if (!url) {
    card[statusField.value] = col.status
    return
  }

  const body = { [statusField.value]: col.status, status: col.status }
  if (updateMethod.value === 'patch') {
    await apiClient.patch(url, body)
  } else {
    await apiClient.put(url, body)
  }
  card[statusField.value] = col.status
}

function onDragStart(card: Record<string, unknown>, ev: DragEvent) {
  dragCard.value = card
  ev.dataTransfer?.setData('text/plain', cardId(card))
}

function onDragOver(colKey: string, ev: DragEvent) {
  ev.preventDefault()
  dragOverCol.value = colKey
}

function onDragLeave() {
  dragOverCol.value = null
}

async function onDrop(col: KanbanColumn) {
  dragOverCol.value = null
  const card = dragCard.value
  dragCard.value = null
  if (!card) return
  try {
    await moveCard(card, col)
  } catch (err) {
    console.error('[FgKanban] status update failed:', err)
  }
}

onMounted(() => { void loadCards() })
</script>

<template>
  <WidgetStateShell
    :loading="loading"
    :error="error"
    :empty="!loading && !error && cards.length === 0"
    min-height="300px"
    @retry="loadCards"
  >
    <div :class="styles.board">
      <div
        v-for="col in columns"
        :key="col.key"
        :class="[styles.column, dragOverCol === col.key && styles.dragOver]"
        @dragover="onDragOver(col.key, $event)"
        @dragleave="onDragLeave"
        @drop="onDrop(col)"
      >
        <div :class="styles.columnHead">
          <span>{{ col.title }}</span>
          <span :class="styles.count">{{ grouped.get(col.key)?.length ?? 0 }}</span>
        </div>
        <div :class="styles.cardList">
          <div
            v-for="card in grouped.get(col.key) ?? []"
            :key="cardId(card)"
            :class="styles.card"
            draggable="true"
            @dragstart="onDragStart(card, $event)"
          >
            <div :class="styles.cardTitle">{{ card[cardTitleField] }}</div>
            <div v-if="cardSubtitleField && card[cardSubtitleField]" :class="styles.cardSub">
              {{ card[cardSubtitleField] }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </WidgetStateShell>
</template>
