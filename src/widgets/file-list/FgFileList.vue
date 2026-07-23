<script setup lang="ts">
import { inject, ref, watch } from 'vue'
import { useI18n } from '@schema-platform/platform-shared'
import { widgetDataKey } from '../base/types'
import { useExposeWidget } from '../../composables/useExposeWidget'
import { useWidgetLayoutStyle } from '../../composables/useWidgetControlSize'
import styles from './style.module.scss'

const { t } = useI18n()
const widgetData = inject(widgetDataKey)!
const { layoutStyle } = useWidgetLayoutStyle(200)

type FileItem = { name: string; url: string }

const fileList = ref<FileItem[]>([])

useExposeWidget(() => ({
  get value() { return fileList.value },
}))

watch(
  () => widgetData.value.defaultValue,
  (val) => {
    fileList.value = Array.isArray(val) ? val as FileItem[] : []
  },
  { immediate: true },
)

function syncValue() {
  widgetData.value.defaultValue = fileList.value
}

function handleUpload() {
  const input = document.createElement('input')
  input.type = 'file'
  input.multiple = (widgetData.value.props?.multiple as boolean) ?? true
  input.accept = (widgetData.value.props?.accept as string) || ''
  input.onchange = () => {
    const files = input.files
    if (!files) return
    for (const file of Array.from(files)) {
      fileList.value.push({ name: file.name, url: URL.createObjectURL(file) })
    }
    syncValue()
  }
  input.click()
}

function handleRemove(index: number) {
  if (widgetData.value.props?.allowDelete === false) return
  fileList.value.splice(index, 1)
  syncValue()
}

function handlePreview(file: FileItem) {
  if (widgetData.value.props?.allowPreview === false) return
  window.open(file.url, '_blank')
}
</script>

<template>
  <div :class="styles.container" :style="layoutStyle">
    <div :class="styles.title">{{ (widgetData.props?.title as string) || t('editor.fileList.title') }}</div>
    <div :class="styles.body">
      <div :class="styles.list">
        <div v-if="!fileList.length" :class="styles.empty">{{ t('editor.fileList.empty') }}</div>
        <div v-for="(file, i) in fileList" :key="i" :class="styles.item">
          <span
            :class="[styles.fileName, { [styles.fileNameClickable]: widgetData.props?.allowPreview !== false }]"
            @click="handlePreview(file)"
          >
            {{ file.name }}
          </span>
          <span
            v-if="widgetData.props?.allowDelete !== false"
            :class="styles.remove"
            @click="handleRemove(i)"
          >
            ×
          </span>
        </div>
      </div>
      <el-button type="primary" :class="styles.uploadBtn" @click="handleUpload">
        {{ (widgetData.props?.buttonText as string) || t('editor.fileList.selectFile') }}
      </el-button>
    </div>
  </div>
</template>
