<script setup lang="ts">
/**
 * FgFormSteps — 分步表单容器
 *
 * 内置步骤条 + 上一步/下一步按钮，每步可包含独立的 widget 集合。
 */
import { inject, ref, computed } from 'vue'
import { widgetDataKey, widgetStyleKey, type Widget } from '../base/types'
import { useExposeWidget } from '../../composables/useExposeWidget'
import SchemaRender from '../../components/WidgetRenderer/SchemaRender.vue'
import styles from './style.module.scss'

const widgetData = inject(widgetDataKey)!
const widgetStyle = inject(widgetStyleKey, ref({}))

const steps = computed(() => {
  const raw = widgetData.value.props?.steps as Array<{ title: string; description?: string; children?: Widget[] }> ?? []
  return raw.map((s, i) => ({
    index: i,
    title: s.title,
    description: s.description ?? '',
    children: (s.children ?? []) as Widget[],
  }))
})

const currentStep = ref(0)
const canPrev = computed(() => currentStep.value > 0)
const canNext = computed(() => currentStep.value < steps.value.length - 1)

function handlePrev() {
  if (canPrev.value) currentStep.value--
}

function handleNext() {
  if (canNext.value) currentStep.value++
}

function handleStepClick(index: number) {
  currentStep.value = index
}

const currentChildren = computed(() => steps.value[currentStep.value]?.children ?? [])

useExposeWidget(() => ({
  get currentStep() { return currentStep.value },
  get totalSteps() { return steps.value.length },
  next: handleNext,
  prev: handlePrev,
  goToStep(step: number) {
    if (step >= 0 && step < steps.value.length) currentStep.value = step
  },
}))
</script>

<template>
  <div :class="styles.formSteps" :style="widgetStyle">
    <div :class="styles.stepsHeader">
      <div
        v-for="step in steps"
        :key="step.index"
        :class="[styles.stepItem, { [styles.stepActive]: step.index === currentStep, [styles.stepDone]: step.index < currentStep }]"
        @click="handleStepClick(step.index)"
      >
        <div :class="styles.stepNumber">
          <span v-if="step.index < currentStep">✓</span>
          <span v-else>{{ step.index + 1 }}</span>
        </div>
        <div :class="styles.stepContent">
          <div :class="styles.stepTitle">{{ step.title }}</div>
          <div v-if="step.description" :class="styles.stepDesc">{{ step.description }}</div>
        </div>
        <div v-if="step.index < steps.length - 1" :class="styles.stepLine" />
      </div>
    </div>
    <div :class="styles.stepBody">
      <SchemaRender v-if="currentChildren.length > 0" :widgets="currentChildren" mode="edit" />
      <div v-else :class="styles.empty">拖拽组件到此步骤</div>
    </div>
    <div :class="styles.stepFooter">
      <button :class="styles.stepBtn" :disabled="!canPrev" @click="handlePrev">上一步</button>
      <button v-if="canNext" :class="[styles.stepBtn, styles.stepBtnPrimary]" @click="handleNext">下一步</button>
      <button v-else :class="[styles.stepBtn, styles.stepBtnSuccess]">完成</button>
    </div>
  </div>
</template>
