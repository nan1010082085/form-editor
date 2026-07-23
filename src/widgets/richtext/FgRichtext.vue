<script setup lang="ts">
import { inject, ref, watch, onMounted } from 'vue'
import { useI18n } from '@schema-platform/platform-shared'
import { widgetDataKey } from '../base/types'
import { useExposeWidget } from '../../composables/useExposeWidget'
import { useWidgetLayoutStyle } from '../../composables/useWidgetControlSize'
import styles from './style.module.scss'

const { t } = useI18n()
const widgetData = inject(widgetDataKey)!
const { layoutStyle: dynamicStyle } = useWidgetLayoutStyle(200)

const editorRef = ref<HTMLDivElement>()
const isReadonly = () => Boolean(widgetData.value.props?.readonly)

useExposeWidget((wd) => ({
  get value() { return wd.value.defaultValue },
}))

function syncFromModel() {
  if (!editorRef.value) return
  const val = (widgetData.value.defaultValue as string) || ''
  if (editorRef.value.innerText !== val) {
    editorRef.value.innerText = val
  }
}

function handleInput() {
  if (!editorRef.value || isReadonly()) return
  widgetData.value.defaultValue = editorRef.value.innerText
}

onMounted(syncFromModel)

watch(() => widgetData.value.defaultValue, syncFromModel)
</script>

<template>
  <div
    :class="styles.richtext"
    :style="dynamicStyle"
  >
    <div v-if="widgetData.props?.showToolbar !== false" :class="styles.toolbar">
      <span>B</span>
      <span>I</span>
      <span>U</span>
    </div>
    <div
      ref="editorRef"
      :class="[styles.content, { [styles.contentEmpty]: !widgetData.defaultValue }]"
      :contenteditable="!isReadonly()"
      :data-placeholder="(widgetData.props?.placeholder as string) || t('editor.richtext.placeholder')"
      @input="handleInput"
    />
  </div>
</template>
