<script setup lang="ts">
import { inject, computed, type CSSProperties } from 'vue'
import { widgetDataKey, widgetStyleKey } from '../base/types'
import { useI18n } from '@schema-platform/platform-shared'
import styles from './FgTitle.module.scss'

const { t } = useI18n()

const widgetData = inject(widgetDataKey)!
const widgetStyle = inject(widgetStyleKey)!

const dynamicStyle = computed<CSSProperties>(() => ({
  fontSize: widgetStyle.value?.fontSize as string,
  fontWeight: widgetStyle.value?.fontWeight as string,
  color: widgetStyle.value?.color as string,
  justifyContent: (widgetData.value.props?.align as string) || 'left',
}))

const tag = computed(() => {
  const level = widgetData.value.props?.level as number
  if (level >= 1 && level <= 4) return `h${level}`
  return 'h3'
})

const content = computed(() => {
  return (widgetData.value.props?.content as string) || t('editor.title.defaultContent')
})
</script>

<template>
  <component :is="tag" :class="styles.title" :style="dynamicStyle">
    {{ content }}
  </component>
</template>

