<script setup lang="ts">
/** E-06 — Kanban 看板：列拖拽 + 状态 API 更新 */
import { inject, computed, ref, onMounted } from 'vue'
import { widgetDataKey } from '../base/types'
import { useExposeWidget } from '../../composables/useExposeWidget'
import { fetchWidgetDataSource } from '@/api/widgetApi'
import { apiClient } from '@/utils/apiClient'
import { resolveWidgetUrl } from '@/utils/resolveWidgetUrl'
import type { KanbanColumn } from './config'
import { groupCardsByStatus } from './kanbanUtils'
import { kanbanMockRows } from './mock'
import { WIDGET_SURFACE_KEY, shouldUseWidgetMock } from '../base/widgetMock'
import styles from './style.module.scss'

const widgetData = inject(widgetDataKey)!
const surface = inject(WIDGET_SURFACE_KEY, 'runtime')

const cards = ref<Record<string, unknown>[]>([])
const loading = ref(false)
const dragCard = ref<Record<string, unknown> | null>(null)
const dragOverCol = ref<string | null>(null)

const columns = computed<KanbanColumn[]>(() =>
  (widgetData.value.props?.columns as KanbanColumn[]) ?? [],
)
const cardTitleField = computed(() => (widgetData.value.props?.cardTitleField as string) || 'title')
const cardSubtitleField = computed(() => widgetData.value.props?.cardSubtitleField as string | undefined)
const statusField = computed(() => (widgetData.value.props?.statusField as string) || 'status')
const updateMethod = computed(() => (widgetData.value.props?.updateMethod as string) || 'put')

const grouped = computed(() =>
  groupCardsByStatus(cards.value, columns.value, statusField.value),
)

useExposeWidget(() => ({
  get cards() { return cards.value },
  get loading() { return loading.value },
  refresh: loadCards,
}))

function normalizeList(raw: unknown): Record<string, unknown>[] {
  if (Array.isArray(raw)) return raw as Record<string, unknown>[]
  if (raw && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>
    if (Array.isArray(obj.items)) return obj.items as Record<string, unknown>[]
  }
  return []
}

async function loadCards() {
  const api = widgetData.value.api
  if (shouldUseWidgetMock(surface, Boolean(api?.url))) {
    cards.value = kanbanMockRows
    return
  }
  if (!api?.url) return

  loading.value = true
  try {
    const url = resolveWidgetUrl(`${api.url}?page=1&pageSize=100`, {})
    const resp = await fetchWidgetDataSource<unknown>(url)
    cards.value = normalizeList(resp)
  } catch (err) {
    console.error('[FgKanban] load failed:', err)
    cards.value = []
  } finally {
    loading.value = false
  }
}

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
  <div v-loading="loading" :class="styles.board">
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
</template>
