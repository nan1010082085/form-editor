<script setup lang="ts">
/**
 * ShadowEditor — 盒阴影编辑器
 * 支持外阴影/内阴影，配置 x/y/blur/spread/color
 */
import { ref, computed, watch } from 'vue'
import { useI18n } from '@schema-platform/platform-shared'

const props = defineProps<{
  value: Record<string, string>
}>()

const emit = defineEmits<{
  update: [patch: Record<string, string>]
}>()

const { t } = useI18n()

type ShadowType = 'outer' | 'inner' | 'none'

const shadowType = ref<ShadowType>('none')
const offsetX = ref(0)
const offsetY = ref(4)
const blur = ref(12)
const spread = ref(0)
const color = ref('rgba(0,0,0,0.15)')

function parseShadow(val: string): void {
  if (!val || val === 'none') {
    shadowType.value = 'none'
    return
  }
  shadowType.value = val.includes('inset') ? 'inner' : 'outer'
  const cleaned = val.replace('inset', '').trim()
  const parts = cleaned.match(/(-?\d+)(?:px)?\s+(-?\d+)(?:px)?\s+(-?\d+)(?:px)?\s+(-?\d+)(?:px)?\s+(.+)/)
  if (parts) {
    offsetX.value = parseInt(parts[1])
    offsetY.value = parseInt(parts[2])
    blur.value = parseInt(parts[3])
    spread.value = parseInt(parts[4])
    color.value = parts[5].trim()
  }
}

function buildShadow(): string {
  if (shadowType.value === 'none') return 'none'
  const inset = shadowType.value === 'inner' ? 'inset ' : ''
  return `${inset}${offsetX.value}px ${offsetY.value}px ${blur.value}px ${spread.value}px ${color.value}`
}

watch(() => props.value?.boxShadow, (val) => {
  if (val !== undefined) parseShadow(val)
}, { immediate: true })

function emitChange() {
  emit('update', { boxShadow: buildShadow() })
}

const presetShadows = [
  { label: '无', value: 'none' },
  { label: '轻微', value: '0 1px 3px rgba(0,0,0,0.12)' },
  { label: '标准', value: '0 4px 12px rgba(0,0,0,0.15)' },
  { label: '加深', value: '0 8px 24px rgba(0,0,0,0.2)' },
  { label: '浮层', value: '0 12px 32px rgba(0,0,0,0.25)' },
  { label: '内阴影', value: 'inset 0 2px 8px rgba(0,0,0,0.1)' },
]

function applyPreset(val: string) {
  parseShadow(val)
  emitChange()
}
</script>

<template>
  <div :class="$style.root">
    <div :class="$style.presets">
      <el-button
        v-for="p in presetShadows"
        :key="p.label"
        size="small"
        :type="buildShadow() === p.value ? 'primary' : 'default'"
        text
        @click="applyPreset(p.value)"
      >{{ p.label }}</el-button>
    </div>
    <div :class="$style.row">
      <el-select v-model="shadowType" size="small" @change="emitChange">
        <el-option label="无" value="none" />
        <el-option label="外阴影" value="outer" />
        <el-option label="内阴影" value="inner" />
      </el-select>
    </div>
    <template v-if="shadowType !== 'none'">
      <div :class="$style.grid">
        <div :class="$style.field">
          <label>X</label>
          <el-input-number v-model="offsetX" size="small" :min="-100" :max="100" @change="emitChange" />
        </div>
        <div :class="$style.field">
          <label>Y</label>
          <el-input-number v-model="offsetY" size="small" :min="-100" :max="100" @change="emitChange" />
        </div>
        <div :class="$style.field">
          <label>Blur</label>
          <el-input-number v-model="blur" size="small" :min="0" :max="200" @change="emitChange" />
        </div>
        <div :class="$style.field">
          <label>Spread</label>
          <el-input-number v-model="spread" size="small" :min="-100" :max="200" @change="emitChange" />
        </div>
      </div>
      <div :class="$style.row">
        <label>Color</label>
        <el-color-picker v-model="color" size="small" show-alpha @change="emitChange" />
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
