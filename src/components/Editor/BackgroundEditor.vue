<script setup lang="ts">
/**
 * BackgroundEditor — 背景编辑器
 * 支持纯色/渐变/背景图片
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

type BgType = 'color' | 'gradient' | 'image' | 'none'

const bgType = ref<BgType>('none')
const bgColor = ref('#ffffff')
const gradientStart = ref('#409eff')
const gradientEnd = ref('#53a8ff')
const gradientAngle = ref(180)
const bgImage = ref('')
const bgSize = ref('cover')
const bgRepeat = ref('no-repeat')

function parseBackground(val: string): void {
  if (!val || val === 'transparent' || val === 'none') {
    bgType.value = 'none'
    return
  }
  if (val.startsWith('linear-gradient')) {
    bgType.value = 'gradient'
    const match = val.match(/linear-gradient\((\d+)deg,\s*(.+?),\s*(.+?)\)/)
    if (match) {
      gradientAngle.value = parseInt(match[1])
      gradientStart.value = match[2].trim()
      gradientEnd.value = match[3].trim()
    }
  } else if (val.startsWith('url(')) {
    bgType.value = 'image'
    bgImage.value = val
  } else {
    bgType.value = 'color'
    bgColor.value = val
  }
}

function buildBackground(): string {
  switch (bgType.value) {
    case 'none': return 'transparent'
    case 'color': return bgColor.value
    case 'gradient': return `linear-gradient(${gradientAngle.value}deg, ${gradientStart.value}, ${gradientEnd.value})`
    case 'image': return bgImage.value || 'transparent'
    default: return 'transparent'
  }
}

watch(() => props.value?.background, (val) => {
  if (val !== undefined) parseBackground(val)
}, { immediate: true })

function emitChange() {
  const patch: Record<string, string> = { background: buildBackground() }
  if (bgType.value === 'image' && bgImage.value) {
    patch.backgroundSize = bgSize.value
    patch.backgroundRepeat = bgRepeat.value
  }
  emit('update', patch)
}

const presetGradients = [
  { label: '默认', value: 'linear-gradient(180deg, #409eff, #53a8ff)' },
  { label: '日落', value: 'linear-gradient(180deg, #ff6b6b, #ffa07a)' },
  { label: '森林', value: 'linear-gradient(180deg, #56ab2f, #a8e063)' },
  { label: '深海', value: 'linear-gradient(180deg, #2c3e50, #3498db)' },
  { label: '紫罗兰', value: 'linear-gradient(180deg, #8e2de2, #4a00e0)' },
  { label: '暗夜', value: 'linear-gradient(180deg, #0f0c29, #302b63, #24243e)' },
]
</script>

<template>
  <div :class="$style.root">
    <div :class="$style.row">
      <el-select v-model="bgType" size="small" @change="emitChange">
        <el-option label="无" value="none" />
        <el-option label="纯色" value="color" />
        <el-option label="渐变" value="gradient" />
        <el-option label="图片" value="image" />
      </el-select>
    </div>

    <template v-if="bgType === 'color'">
      <div :class="$style.row">
        <el-color-picker v-model="bgColor" size="small" show-alpha @change="emitChange" />
        <el-input v-model="bgColor" size="small" @change="emitChange" />
      </div>
    </template>

    <template v-if="bgType === 'gradient'">
      <div :class="$style.presets">
        <div
          v-for="p in presetGradients"
          :key="p.label"
          :class="$style.presetChip"
          :style="{ background: p.value }"
          :title="p.label"
          @click="gradientStart = p.value.match(/#[a-f0-9]+/gi)?.[0] || gradientStart; gradientEnd = p.value.match(/#[a-f0-9]+/gi)?.[1] || gradientEnd; emitChange()"
        />
      </div>
      <div :class="$style.row">
        <label>起始</label>
        <el-color-picker v-model="gradientStart" size="small" @change="emitChange" />
        <label>结束</label>
        <el-color-picker v-model="gradientEnd" size="small" @change="emitChange" />
      </div>
      <div :class="$style.row">
        <label>角度</label>
        <el-slider v-model="gradientAngle" :min="0" :max="360" size="small" style="flex:1" @change="emitChange" />
        <span :class="$style.angleVal">{{ gradientAngle }}°</span>
      </div>
    </template>

    <template v-if="bgType === 'image'">
      <div :class="$style.row">
        <el-input v-model="bgImage" size="small" placeholder="url(...)" @change="emitChange" />
      </div>
      <div :class="$style.row">
        <label>尺寸</label>
        <el-select v-model="bgSize" size="small" @change="emitChange">
          <el-option label="覆盖" value="cover" />
          <el-option label="包含" value="contain" />
          <el-option label="原始" value="auto" />
        </el-select>
        <label>重复</label>
        <el-select v-model="bgRepeat" size="small" @change="emitChange">
          <el-option label="不重复" value="no-repeat" />
          <el-option label="重复" value="repeat" />
          <el-option label="水平" value="repeat-x" />
          <el-option label="垂直" value="repeat-y" />
        </el-select>
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
.row {
  display: flex;
  align-items: center;
  gap: 8px;
  label {
    font-size: 12px;
    color: var(--text-color-secondary);
    min-width: 32px;
  }
}
.presets {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.presetChip {
  width: 28px;
  height: 28px;
  border-radius: 4px;
  cursor: pointer;
  border: 2px solid transparent;
  transition: border-color 0.2s;
  &:hover {
    border-color: var(--color-primary);
  }
}
.angleVal {
  font-size: 12px;
  color: var(--text-color-secondary);
  min-width: 36px;
  text-align: right;
}
</style>
