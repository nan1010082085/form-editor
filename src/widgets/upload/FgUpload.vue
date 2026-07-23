<script setup lang="ts">
import { inject, computed, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import type { UploadFile, UploadUserFile } from 'element-plus'
import { useI18n } from '@schema-platform/platform-shared'
import { widgetDataKey } from '../base/types'
import './FgUpload.module.scss'
import { useExposeWidget } from '../../composables/useExposeWidget'
import { useWidgetLayoutStyle } from '../../composables/useWidgetControlSize'

const { t } = useI18n()
const widgetData = inject(widgetDataKey)!
const { layoutStyle } = useWidgetLayoutStyle(80, 240)

useExposeWidget((wd) => ({
  get value() { return wd.value.defaultValue },
}))

type StoredFile = { name: string; uid?: string | number; url?: string; size?: number }

const fileList = ref<UploadUserFile[]>([])

function toUploadFiles(stored: StoredFile[]): UploadUserFile[] {
  return stored.map((f, i) => ({
    name: f.name,
    url: f.url,
    uid: f.uid ?? i,
    status: 'success',
  }))
}

function toStored(files: UploadUserFile[]): StoredFile[] {
  return files.map(f => ({
    name: f.name,
    uid: f.uid,
    url: f.url,
    size: f.size,
  }))
}

watch(
  () => widgetData.value.defaultValue,
  (val) => {
    const arr = Array.isArray(val) ? val as StoredFile[] : []
    fileList.value = toUploadFiles(arr)
  },
  { immediate: true },
)

const accept = computed(() => (widgetData.value.props?.accept as string) || undefined)
const multiple = computed(() => Boolean(widgetData.value.props?.multiple))
const limit = computed(() => (widgetData.value.props?.limit as number) || undefined)
const maxSizeMb = computed(() => (widgetData.value.props?.maxSize as number) || 10)
const buttonText = computed(() => (widgetData.value.props?.buttonText as string) || t('editor.upload.clickToUpload'))
const listType = computed(() => ((widgetData.value.props?.listType as string) || 'text') as 'text' | 'picture' | 'picture-card')

function syncDefaultValue(files: UploadUserFile[]) {
  widgetData.value.defaultValue = toStored(files)
}

function handleChange(_uploadFile: UploadFile, uploadFiles: UploadUserFile[]) {
  fileList.value = uploadFiles
  syncDefaultValue(uploadFiles)
}

function handleRemove(_file: UploadFile, uploadFiles: UploadUserFile[]) {
  fileList.value = uploadFiles
  syncDefaultValue(uploadFiles)
}

function beforeUpload(rawFile: File) {
  const maxBytes = maxSizeMb.value * 1024 * 1024
  if (rawFile.size > maxBytes) {
    ElMessage.warning(t('editor.upload.fileSizeExceeded', { size: maxSizeMb.value }))
    return false
  }
  return true
}
</script>

<template>
  <el-upload
    v-model:file-list="fileList"
    class="fg-upload"
    action="#"
    :style="layoutStyle"
    :accept="accept"
    :multiple="multiple"
    :limit="limit"
    :list-type="listType"
    :auto-upload="false"
    :before-upload="beforeUpload"
    @change="handleChange"
    @remove="handleRemove"
  >
    <el-button type="primary">{{ buttonText }}</el-button>
  </el-upload>
</template>
