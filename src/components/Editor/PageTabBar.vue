<script setup lang="ts">
/**
 * PageTabBar — 多页面 Tab 栏
 *
 * 显示在画布上方，支持切换、新增、重命名、删除页面。
 * 仅在多页面模式下显示。
 */
import { ref, nextTick } from 'vue'
import { useBoardStore } from '@/stores/board'
import { useWidgetStore } from '@/stores/widget'
import { generateWidgetId } from '@/widgets/registry'
import AppIcon from '@schema-platform/platform-shared/components/common/AppIcon.vue'
import styles from './PageTabBar.module.scss'

const boardStore = useBoardStore()
const widgetStore = useWidgetStore()

const editingPageId = ref('')
const editingName = ref('')
const editInputRef = ref<HTMLInputElement>()

function handleSwitch(pageId: string) {
  if (pageId === boardStore.currentPageId) return
  const fromId = boardStore.currentPageId
  const toPage = boardStore.pages.find(p => p.id === pageId)
  widgetStore.switchPage(fromId, pageId, toPage?.widgets)
  boardStore.switchPage(pageId)
}

function handleAdd() {
  const id = `page_${Date.now()}`
  const pageNum = boardStore.pages.length + 1
  boardStore.addPage({
    id,
    name: `页面 ${pageNum}`,
    widgets: [],
  })
  widgetStore.switchPage(boardStore.currentPageId, id)
}

function startRename(pageId: string, currentName: string) {
  editingPageId.value = pageId
  editingName.value = currentName
  nextTick(() => editInputRef.value?.focus())
}

function confirmRename() {
  if (editingPageId.value && editingName.value.trim()) {
    boardStore.renamePage(editingPageId.value, editingName.value.trim())
  }
  editingPageId.value = ''
}

function handleDelete(pageId: string) {
  if (boardStore.pages.length <= 1) return
  const idx = boardStore.pages.findIndex(p => p.id === pageId)
  boardStore.removePage(pageId)
  widgetStore.pageWidgets.delete(pageId)
  // 切换到相邻页面
  const newPage = boardStore.pages[Math.min(idx, boardStore.pages.length - 1)]
  if (newPage) {
    widgetStore.switchPage(pageId, newPage.id, newPage.widgets)
    boardStore.switchPage(newPage.id)
  }
}
</script>

<template>
  <div v-if="boardStore.isMultiPage" :class="styles.tabBar">
    <div :class="styles.tabs">
      <div
        v-for="page in boardStore.pages"
        :key="page.id"
        :class="[styles.tab, { [styles.tabActive]: page.id === boardStore.currentPageId }]"
        @click="handleSwitch(page.id)"
        @dblclick="startRename(page.id, page.name)"
      >
        <template v-if="editingPageId === page.id">
          <input
            ref="editInputRef"
            v-model="editingName"
            :class="styles.tabInput"
            @blur="confirmRename"
            @keyup.enter="confirmRename"
            @keyup.escape="editingPageId = ''"
          />
        </template>
        <template v-else>
          <span :class="styles.tabName">{{ page.name }}</span>
        </template>
        <button
          v-if="boardStore.pages.length > 1"
          :class="styles.tabClose"
          title="删除页面"
          @click.stop="handleDelete(page.id)"
        >
          <AppIcon name="close" :size="12" />
        </button>
      </div>
    </div>
    <button :class="styles.addTab" title="新增页面" @click="handleAdd">
      <AppIcon name="plus" :size="14" />
    </button>
  </div>
</template>
