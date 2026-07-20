<script setup lang="ts">
/**
 * PropertyPanelConfigBar — 事件/联动/数据源/变量配置入口
 */
import type { Widget } from '../../widgets/base/types'
import type { ConfigPanelType } from '../../widgets/base/types'
import styles from './style.module.scss'
import AppIcon from '@schema-platform/platform-shared/components/common/AppIcon.vue'

defineProps<{
  configPanels: ConfigPanelType[]
  configHelpText: string
  selectedWidget: Widget
}>()

const emit = defineEmits<{
  openEvent: []
  openLinkage: []
  openApi: []
  openVariables: []
}>()
</script>

<template>
  <div v-if="configPanels.length" :class="styles.configActions">
    <div style="overflow: auto;">
      <div :class="styles.configButtons">
        <el-popover placement="bottom-start" :width="280" trigger="click">
          <template #default>
            <div :class="styles.helpContent" v-html="configHelpText" />
          </template>
          <template #reference>
            <div :class="styles.helpIconWrap">
              <AppIcon name="question-filled" :class="styles.helpIcon" />
            </div>
          </template>
        </el-popover>
        <template v-for="panel in configPanels" :key="panel">
          <el-button v-if="panel === 'events'" plain @click="emit('openEvent')">
            事件配置
            <span v-if="selectedWidget.events?.length" :class="styles.badge">
              {{ selectedWidget.events.length }}
            </span>
          </el-button>
          <el-button v-if="panel === 'linkages' || panel === 'rules'" plain @click="emit('openLinkage')">
            字段联动
            <span v-if="selectedWidget.linkages?.length" :class="styles.badge">
              {{ selectedWidget.linkages.length }}
            </span>
          </el-button>
          <el-button v-if="panel === 'api'" plain @click="emit('openApi')">
            数据源
            <span v-if="selectedWidget.api" :class="styles.badge">1</span>
          </el-button>
          <el-button v-if="panel === 'variables'" plain @click="emit('openVariables')">
            变量
            <span v-if="selectedWidget.variables?.length" :class="styles.badge">
              {{ selectedWidget.variables.length }}
            </span>
          </el-button>
        </template>
      </div>
    </div>
  </div>
</template>
