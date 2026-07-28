<script setup lang="ts">
import { computed } from "vue";
import { getWidget, getWidgetDisplayName } from "@/widgets/registry";
import type { Widget, ConfigPanelType } from "@/widgets/base/types";
import { useI18n } from "@schema-platform/platform-shared";
import styles from "./WidgetContextMenu.module.scss";

const { t } = useI18n();

const props = defineProps<{
  visible: boolean;
  x: number;
  y: number;
  widget: Widget | null;
}>();

const emit = defineEmits<{
  close: [];
  copy: [widget: Widget];
  copyId: [id: string];
  delete: [widget: Widget];
  bringToFront: [widget: Widget];
  sendToBack: [widget: Widget];
  toggleLock: [widget: Widget];
  toggleHidden: [widget: Widget];
  openEvent: [widget: Widget];
  openRule: [widget: Widget];
  openApi: [widget: Widget];
  openVariables: [widget: Widget];
  openChartLinkage: [widget: Widget];
  savePreview: [widget: Widget];
}>();

const widgetConfig = computed(() => {
  if (!props.widget) return null;
  const reg = getWidget(props.widget.type);
  return reg?.config ?? null;
});

const configPanels = computed<ConfigPanelType[]>(() => {
  return widgetConfig.value?.configPanels ?? [];
});

function handleAction(action: string) {
  if (!props.widget) return;
  switch (action) {
    case "copy":
      emit("copy", props.widget);
      break;
    case "copyId":
      emit("copyId", props.widget.id);
      break;
    case "delete":
      emit("delete", props.widget);
      break;
    case "bringToFront":
      emit("bringToFront", props.widget);
      break;
    case "sendToBack":
      emit("sendToBack", props.widget);
      break;
    case "toggleLock":
      emit("toggleLock", props.widget);
      break;
    case "toggleHidden":
      emit("toggleHidden", props.widget);
      break;
    case "event":
      emit("openEvent", props.widget);
      break;
    case "rule":
      emit("openRule", props.widget);
      break;
    case "api":
      emit("openApi", props.widget);
      break;
    case "variables":
      emit("openVariables", props.widget);
      break;
    case "chartLinkage":
      emit("openChartLinkage", props.widget);
      break;
    case "savePreview":
      emit("savePreview", props.widget);
      break;
  }
  emit("close");
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="visible"
      :class="styles.backdrop"
      @click="emit('close')"
      @contextmenu.prevent="emit('close')"
    />
    <div
      v-if="visible && widget"
      :class="styles.menu"
      :style="{ left: `${x}px`, top: `${y}px` }"
    >
      <div :class="styles.header">
        {{ widget ? getWidgetDisplayName(widget.type, t) : "" }}
      </div>
      <div :class="styles.item" @click="handleAction('copy')">
        {{ t("editor.contextMenu.copyWidget") }}
      </div>
      <div :class="styles.item" @click="handleAction('copyId')">
        {{ t("editor.contextMenu.copyId") }}
      </div>
      <div :class="styles.item" @click="handleAction('bringToFront')">
        {{ t("editor.contextMenu.bringToFront") }}
      </div>
      <div :class="styles.item" @click="handleAction('sendToBack')">
        {{ t("editor.contextMenu.sendToBack") }}
      </div>
      <div :class="styles.item" @click="handleAction('toggleLock')">
        {{
          widget.locked
            ? t("editor.contextMenu.unlock")
            : t("editor.contextMenu.lock")
        }}
      </div>
      <div :class="styles.item" @click="handleAction('toggleHidden')">
        {{
          widget.hidden
            ? t("editor.contextMenu.show")
            : t("editor.contextMenu.hide")
        }}
      </div>
      <div :class="styles.item" @click="handleAction('delete')">
        {{ t("editor.contextMenu.deleteWidget") }}
      </div>
      <div :class="styles.item" @click="handleAction('savePreview')">
        {{ t("editor.toolbar.thumbnail") }}
      </div>
      <template v-if="configPanels.length">
        <div :class="styles.divider" />
        <div
          v-if="configPanels.includes('events')"
          :class="styles.item"
          @click="handleAction('event')"
        >
          {{ t("editor.contextMenu.eventConfig") }}
        </div>
        <div
          v-if="configPanels.includes('linkages')"
          :class="styles.item"
          @click="handleAction('rule')"
        >
          {{ t("editor.contextMenu.linkageConfig") }}
        </div>
        <div
          v-if="configPanels.includes('api')"
          :class="styles.item"
          @click="handleAction('api')"
        >
          {{ t("editor.contextMenu.apiConfig") }}
        </div>
        <div
          v-if="configPanels.includes('variables')"
          :class="styles.item"
          @click="handleAction('variables')"
        >
          {{ t("editor.contextMenu.variableConfig") }}
        </div>
        <div
          v-if="configPanels.includes('chart-linkages')"
          :class="styles.item"
          @click="handleAction('chartLinkage')"
        >
          {{ t("editor.contextMenu.chartLinkageConfig") }}
        </div>
      </template>
    </div>
  </Teleport>
</template>
