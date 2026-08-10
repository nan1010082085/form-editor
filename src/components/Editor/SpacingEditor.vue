<script setup lang="ts">
/**
 * SpacingEditor -- Margin/Padding可视化Edit器
 *
 * 设计：
 * - 链接模式（默认）：单个Input, 四边Sync
 * - 解除链接：4 个独立Input（上右下左）, 可Min别Settings不同Value
 * - 中央矩形实Hrs预览各边数Value
 */
import { ref, computed } from "vue";
import styles from "./SpacingEditor.module.scss";
import AppIcon from "@schema-platform/platform-shared/components/common/AppIcon.vue";
import { useI18n } from "@schema-platform/platform-shared";

const { t } = useI18n();

const props = defineProps<{
  /** 'margin' 或 'padding' */
  mode: "margin" | "padding";
  value?: Record<string, string>;
}>();

const emit = defineEmits<{
  update: [patch: Record<string, string>];
}>();

// ---- 链接模式 ----

const linked = ref(true);

type Side = "top" | "right" | "bottom" | "left";

const SIDE_PROP_MAP: Record<Side, Record<string, string>> = {
  top: { margin: "marginTop", padding: "paddingTop" },
  right: { margin: "marginRight", padding: "paddingRight" },
  bottom: { margin: "marginBottom", padding: "paddingBottom" },
  left: { margin: "marginLeft", padding: "paddingLeft" },
};

// ---- ParseValue ----

function parsePx(val?: string): number {
  if (!val) return 0;
  const m = val.match(/^(\d+(?:\.\d+)?)/);
  return m ? parseFloat(m[1]) : 0;
}

function getSideVal(side: Side): number {
  const v = props.value ?? {};
  const prefix = props.mode;
  // 优先读取单边Property, fallback 到简写
  return parsePx(v[SIDE_PROP_MAP[side][prefix]]) || parsePx(v[prefix]);
}

const linkedValue = computed(() => {
  const v = props.value ?? {};
  return parsePx(v[props.mode]);
});

const topVal = computed(() => getSideVal("top"));
const rightVal = computed(() => getSideVal("right"));
const bottomVal = computed(() => getSideVal("bottom"));
const leftVal = computed(() => getSideVal("left"));

// ---- Action ----

function applyLinked(val: number | undefined) {
  const v = `${val ?? 0}px`;
  const prefix = props.mode;
  emit("update", {
    [prefix]: v,
    [`${prefix}Top`]: "",
    [`${prefix}Right`]: "",
    [`${prefix}Bottom`]: "",
    [`${prefix}Left`]: "",
  });
}

function applySide(side: Side, val: number | undefined) {
  const v = `${val ?? 0}px`;
  const prefix = props.mode;
  const prop = SIDE_PROP_MAP[side][prefix];
  const patch: Record<string, string> = { [prop]: v, [prefix]: "" };
  emit("update", patch);
}

function toggleLinked() {
  linked.value = !linked.value;
  if (linked.value) {
    // 切回链接模式：用当前 top Value统一四边
    applyLinked(topVal.value);
  }
}
</script>

<template>
  <div :class="styles.editor">
    <!-- 视觉预览Region -->
    <div :class="styles.preview">
      <div :class="styles.box">
        <!-- Top -->
        <div :class="[styles.side, styles.sideTop]">
          <span :class="styles.sideValue">{{ topVal }}</span>
        </div>
        <!-- Right -->
        <div :class="[styles.side, styles.sideRight]">
          <span :class="[styles.sideValue, styles.sideValueVertical]">{{
            rightVal
          }}</span>
        </div>
        <!-- Bottom -->
        <div :class="[styles.side, styles.sideBottom]">
          <span :class="styles.sideValue">{{ bottomVal }}</span>
        </div>
        <!-- Left -->
        <div :class="[styles.side, styles.sideLeft]">
          <span :class="[styles.sideValue, styles.sideValueVertical]">{{
            leftVal
          }}</span>
        </div>
        <!-- Center -->
        <div :class="styles.center">
          <span :class="styles.centerLabel">{{
            mode === "margin" ? "M" : "P"
          }}</span>
        </div>
      </div>

      <!-- Link toggle -->
      <el-tooltip
        :content="
          linked
            ? t('editor.spacingEditor.unlink')
            : t('editor.spacingEditor.linkFour')
        "
        placement="top"
        :show-after="300"
      >
        <button
          :class="[styles.linkBtn, linked && styles.linkBtnActive]"
          @click="toggleLinked"
        >
          <AppIcon name="link" />
        </button>
      </el-tooltip>
    </div>

    <!-- 链接模式：单个Input -->
    <div v-if="linked" :class="styles.controls">
      <div :class="styles.controlRow">
        <label :class="styles.controlLabel">{{
          t("editor.spacingEditor.value")
        }}</label>
        <el-input-number
          :model-value="linkedValue"
          :min="0"
          :max="200"
          size="small"
          controls-position="right"
          :class="styles.numberInput"
          @update:model-value="applyLinked"
        />
      </div>
    </div>

    <!-- 解除链接：4 个独立Input -->
    <div v-else :class="styles.controlsGrid">
      <div :class="styles.gridCell">
        <label :class="styles.gridLabel">{{
          t("editor.spacingEditor.top")
        }}</label>
        <el-input-number
          :model-value="topVal"
          :min="0"
          :max="200"
          size="small"
          controls-position="right"
          :class="styles.gridInput"
          @update:model-value="(v: number | undefined) => applySide('top', v)"
        />
      </div>
      <div :class="styles.gridCell">
        <label :class="styles.gridLabel">{{
          t("editor.spacingEditor.right")
        }}</label>
        <el-input-number
          :model-value="rightVal"
          :min="0"
          :max="200"
          size="small"
          controls-position="right"
          :class="styles.gridInput"
          @update:model-value="(v: number | undefined) => applySide('right', v)"
        />
      </div>
      <div :class="styles.gridCell">
        <label :class="styles.gridLabel">{{
          t("editor.spacingEditor.bottom")
        }}</label>
        <el-input-number
          :model-value="bottomVal"
          :min="0"
          :max="200"
          size="small"
          controls-position="right"
          :class="styles.gridInput"
          @update:model-value="
            (v: number | undefined) => applySide('bottom', v)
          "
        />
      </div>
      <div :class="styles.gridCell">
        <label :class="styles.gridLabel">{{
          t("editor.spacingEditor.left")
        }}</label>
        <el-input-number
          :model-value="leftVal"
          :min="0"
          :max="200"
          size="small"
          controls-position="right"
          :class="styles.gridInput"
          @update:model-value="(v: number | undefined) => applySide('left', v)"
        />
      </div>
    </div>
  </div>
</template>
