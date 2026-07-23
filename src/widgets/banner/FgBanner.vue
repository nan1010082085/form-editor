<script setup lang="ts">
import { inject } from 'vue'
import { useI18n } from '@schema-platform/platform-shared'
import { widgetDataKey } from '../base/types'

const { t } = useI18n()
const widgetData = inject(widgetDataKey)!
</script>
<template>
  <el-alert
    :title="(widgetData.props?.text as string) || t('editor.banner.defaultTitle')"
    :type="(widgetData.props?.type as 'info' | 'success' | 'warning' | 'error') || 'info'"
    :closable="widgetData.props?.closable !== false"
  />
</template>
