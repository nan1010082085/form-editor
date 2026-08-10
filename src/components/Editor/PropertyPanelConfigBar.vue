<script setup lang="ts">
/**
 * PropertyPanelConfigBar — Event/Linkage/Data源/变量Config入口
 */
import { useI18n } from "@schema-platform/platform-shared";
import type { Widget } from "../../widgets/base/types";
import type { ConfigPanelType } from "../../widgets/base/types";
import styles from "./style.module.scss";
import AppIcon from "@schema-platform/platform-shared/components/common/AppIcon.vue";

defineProps<{
  configPanels: ConfigPanelType[];
  configHelpText: string;
  selectedWidget: Widget;
}>();

const emit = defineEmits<{
  openEvent: [];
  openLinkage: [];
  openApi: [];
  openVariables: [];
  openChartLinkage: [];
}>();

const { t } = useI18n();
</script>

<template>
  <div v-if="configPanels.length" :class="styles.configActions">
    <div style="overflow: auto">
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
            {{ t("editor.property.helpEvents") }}
            <span v-if="selectedWidget.events?.length" :class="styles.badge">
              {{ selectedWidget.events.length }}
            </span>
          </el-button>
          <el-button
            v-if="panel === 'linkages'"
            plain
            @click="emit('openLinkage')"
          >
            {{ t("editor.property.helpLinkage") }}
            <span v-if="selectedWidget.linkages?.length" :class="styles.badge">
              {{ selectedWidget.linkages.length }}
            </span>
          </el-button>
          <el-button v-if="panel === 'api'" plain @click="emit('openApi')">
            {{ t("editor.property.helpApi") }}
            <span v-if="selectedWidget.api" :class="styles.badge">1</span>
          </el-button>
          <el-button
            v-if="panel === 'variables'"
            plain
            @click="emit('openVariables')"
          >
            {{ t("editor.property.helpVariable") }}
            <span v-if="selectedWidget.variables?.length" :class="styles.badge">
              {{ selectedWidget.variables.length }}
            </span>
          </el-button>
          <el-button
            v-if="panel === 'chart-linkages'"
            plain
            @click="emit('openChartLinkage')"
          >
            {{ t("editor.contextMenu.chartLinkageConfig") }}
            <span
              v-if="selectedWidget.chartLinkages?.length"
              :class="styles.badge"
            >
              {{ selectedWidget.chartLinkages.length }}
            </span>
          </el-button>
        </template>
      </div>
    </div>
  </div>
</template>
