<script setup lang="ts">
/**
 * ChartLinkageDialog — ChartLinkageConfig对话框
 *
 * 写入 widget.chartLinkages, 运RowHrs由 useChartLinkage 消费。
 */
import { ref, watch, computed } from "vue";
import { useI18n } from "@schema-platform/platform-shared";
import type { ChartLinkageRule, Widget } from "@/widgets/base/types";
import AppDialog from "@schema-platform/platform-shared/components/common/AppDialog.vue";
import ChartLinkageConfig from "./ChartLinkageConfig.vue";
import { useWidgetStore } from "@/stores/widget";

const props = defineProps<{
  visible: boolean;
  sourceWidgetId: string;
  chartLinkages: ChartLinkageRule[];
}>();

const emit = defineEmits<{
  "update:visible": [val: boolean];
  save: [rules: ChartLinkageRule[]];
}>();

const { t } = useI18n();

const widgetStore = useWidgetStore();

const allWidgets = computed<Widget[]>(() => widgetStore.widgets);

const localRules = ref<ChartLinkageRule[]>([]);

watch(
  () => props.visible,
  (open) => {
    if (open) {
      localRules.value = JSON.parse(JSON.stringify(props.chartLinkages ?? []));
    }
  },
);

function handleSave() {
  emit("save", localRules.value);
  emit("update:visible", false);
}

function handleClose() {
  emit("update:visible", false);
}
</script>

<template>
  <AppDialog
    :model-value="visible"
    :title="t('editor.configDialog.chartLinkage')"
    width="640px"
    destroy-on-close
    @update:model-value="handleClose"
  >
    <ChartLinkageConfig
      :rules="localRules"
      :source-widget-id="sourceWidgetId"
      :all-widgets="allWidgets"
      @update:rules="localRules = $event"
    />
    <template #footer>
      <el-button @click="handleClose">{{ t('editor.common.cancel') }}</el-button>
      <el-button type="primary" @click="handleSave">{{ t('editor.common.save') }}</el-button>
    </template>
  </AppDialog>
</template>
