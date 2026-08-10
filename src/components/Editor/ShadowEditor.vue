<script setup lang="ts">
/**
 * ShadowEditor — 盒ShadowEdit器
 * 支持外Shadow/内Shadow, Config x/y/blur/spread/color
 */
import { ref, watch, computed } from "vue";
import { useI18n } from "@schema-platform/platform-shared";

const props = defineProps<{
  value: Record<string, string>;
}>();

const emit = defineEmits<{
  update: [patch: Record<string, string>];
}>();

const { t } = useI18n();

type ShadowType = "outer" | "inner" | "none";

const shadowType = ref<ShadowType>("none");
const offsetX = ref(0);
const offsetY = ref(4);
const blur = ref(12);
const spread = ref(0);
const color = ref("rgba(0,0,0,0.15)");

function parseShadow(val: string): void {
  if (!val || val === "none") {
    shadowType.value = "none";
    return;
  }
  shadowType.value = val.includes("inset") ? "inner" : "outer";
  const cleaned = val.replace("inset", "").trim();
  const parts = cleaned.match(
    /(-?\d+)(?:px)?\s+(-?\d+)(?:px)?\s+(-?\d+)(?:px)?\s+(-?\d+)(?:px)?\s+(.+)/,
  );
  if (parts) {
    offsetX.value = parseInt(parts[1]);
    offsetY.value = parseInt(parts[2]);
    blur.value = parseInt(parts[3]);
    spread.value = parseInt(parts[4]);
    color.value = parts[5].trim();
  }
}

function buildShadow(): string {
  if (shadowType.value === "none") return "none";
  const inset = shadowType.value === "inner" ? "inset " : "";
  return `${inset}${offsetX.value}px ${offsetY.value}px ${blur.value}px ${spread.value}px ${color.value}`;
}

watch(
  () => props.value?.boxShadow,
  (val) => {
    if (val !== undefined) parseShadow(val);
  },
  { immediate: true },
);

function emitChange() {
  emit("update", { boxShadow: buildShadow() });
}

const presetShadows = computed(() => [
  { label: t("editor.shadowEditor.presetNone"), value: "none" },
  {
    label: t("editor.shadowEditor.presetLight"),
    value: "0 1px 3px rgba(0,0,0,0.12)",
  },
  {
    label: t("editor.shadowEditor.presetStandard"),
    value: "0 4px 12px rgba(0,0,0,0.15)",
  },
  {
    label: t("editor.shadowEditor.presetDeep"),
    value: "0 8px 24px rgba(0,0,0,0.2)",
  },
  {
    label: t("editor.shadowEditor.presetFloat"),
    value: "0 12px 32px rgba(0,0,0,0.25)",
  },
  {
    label: t("editor.shadowEditor.presetInner"),
    value: "inset 0 2px 8px rgba(0,0,0,0.1)",
  },
]);

function applyPreset(val: string) {
  parseShadow(val);
  emitChange();
}
</script>

<template>
  <div :class="$style.root">
    <div :class="$style.presets">
      <el-button
        v-for="p in presetShadows"
        :key="p.value"
        size="small"
        :type="buildShadow() === p.value ? 'primary' : 'default'"
        text
        @click="applyPreset(p.value)"
        >{{ p.label }}</el-button
      >
    </div>
    <div :class="$style.row">
      <el-select v-model="shadowType" size="small" @change="emitChange">
        <el-option :label="t('editor.shadowEditor.typeNone')" value="none" />
        <el-option :label="t('editor.shadowEditor.typeOuter')" value="outer" />
        <el-option :label="t('editor.shadowEditor.typeInner')" value="inner" />
      </el-select>
    </div>
    <template v-if="shadowType !== 'none'">
      <div :class="$style.grid">
        <div :class="$style.field">
          <label>{{ t("editor.shadowEditor.offsetX") }}</label>
          <el-input-number
            v-model="offsetX"
            size="small"
            :min="-100"
            :max="100"
            @change="emitChange"
          />
        </div>
        <div :class="$style.field">
          <label>{{ t("editor.shadowEditor.offsetY") }}</label>
          <el-input-number
            v-model="offsetY"
            size="small"
            :min="-100"
            :max="100"
            @change="emitChange"
          />
        </div>
        <div :class="$style.field">
          <label>{{ t("editor.shadowEditor.blur") }}</label>
          <el-input-number
            v-model="blur"
            size="small"
            :min="0"
            :max="200"
            @change="emitChange"
          />
        </div>
        <div :class="$style.field">
          <label>{{ t("editor.shadowEditor.spread") }}</label>
          <el-input-number
            v-model="spread"
            size="small"
            :min="-100"
            :max="200"
            @change="emitChange"
          />
        </div>
      </div>
      <div :class="$style.row">
        <label>{{ t("editor.shadowEditor.color") }}</label>
        <el-color-picker
          v-model="color"
          size="small"
          show-alpha
          @change="emitChange"
        />
      </div>
    </template>
  </div>
</template>

<style module lang="scss">
.root {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.presets {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.row {
  display: flex;
  align-items: center;
  gap: 8px;
  label {
    font-size: 12px;
    color: var(--text-color-secondary);
    min-width: 40px;
  }
}
.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 2px;
  label {
    font-size: 11px;
    color: var(--text-color-secondary);
  }
}
</style>
