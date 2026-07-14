<script setup lang="ts">
/**
 * FgCard — 卡片容器 Widget
 *
 * 职责：
 * - el-card 包裹，提供卡片视觉容器
 * - 渲染标题和子组件
 */
import { inject, computed } from 'vue'
import { widgetDataKey, widgetStyleKey } from '../base/types'
import styles from './style.module.scss'

const props = defineProps<{ editable?: boolean }>()

const widgetData = inject(widgetDataKey)!
const widgetStyle = inject(widgetStyleKey)!

const hasChildren = computed(() => (widgetData.value.children?.length ?? 0) > 0)

const dynamicStyle = computed(() => ({
  margin: widgetStyle.value?.margin as string,
  padding: widgetStyle.value?.padding as string,
  backgroundColor: widgetStyle.value?.backgroundColor as string,
  borderRadius: widgetStyle.value?.borderRadius as string,
}))
</script>

<template>
  <el-card
    :class="styles.cardContainer"
    :style="dynamicStyle"
    :shadow="(widgetData.props?.shadow as 'always' | 'hover' | 'never') || 'hover'"
    :header="widgetData.props?.showHeader !== false ? ((widgetData.props?.title as string) || '卡片标题') : undefined"
  >
    <div :class="styles.body">
      <slot />
      <div v-if="props.editable && !hasChildren" :class="styles.ghost">
        拖入部件
      </div>
    </div>
  </el-card>
</template>
