/**
 * useBoardPropertyUpdater - 画布属性更新逻辑
 *
 * 从 PropertyPanel 抽出的业务逻辑：
 * - themePreset：应用主题预设（canvas + cssVars）
 * - layoutMode：由模板固定，不可切换
 * - freeLayout.*：自由布局子字段
 * - widthUnit / heightUnit：切换单位时自动 px <-> % 换算
 * - 其他：直接写入 canvas
 */
import type { useBoardStore } from '@/stores/board'
import type { CanvasUnit } from '@/widgets/base/types'
import { BOARD_THEME_PRESETS } from '@/utils/boardThemes'

export function useBoardPropertyUpdater(boardStore: ReturnType<typeof useBoardStore>) {
  function updateBoardProperty(key: string, value: unknown) {
    if (key === 'themePreset') {
      const preset = BOARD_THEME_PRESETS.find(p => p.id === value)
      if (preset) {
        boardStore.updateCanvas({ ...preset.canvas, themePreset: preset.id } as typeof boardStore.canvas)
        if (preset.cssVars) {
          for (const [k, v] of Object.entries(preset.cssVars)) {
            document.documentElement.style.setProperty(k, v)
          }
        }
      }
      return
    }

    if (key === 'layoutMode') {
      // 布局模式由创建时模板固定，不可切换（工具栏仅展示）
      return
    }

    if (key.startsWith('freeLayout.')) {
      const subKey = key.slice('freeLayout.'.length) as keyof NonNullable<typeof boardStore.canvas.freeLayout>
      const fl = { ...(boardStore.canvas.freeLayout ?? {}), [subKey]: value === '' ? undefined : value }
      boardStore.updateCanvas({ freeLayout: fl })
      return
    }

    // 切换单位时自动转换数值
    if (key === 'widthUnit') {
      const newUnit = value as CanvasUnit
      const oldUnit = boardStore.canvas.widthUnit ?? 'px'
      if (newUnit !== oldUnit) {
        const currentWidth = boardStore.canvas.width
        const parentWidth = boardStore.getCanvasWidthPx()
        if (oldUnit === 'px' && newUnit === '%' && parentWidth > 0) {
          boardStore.updateCanvas({ widthUnit: newUnit, width: Math.round((currentWidth / parentWidth) * 100 * 100) / 100 })
          return
        } else if (oldUnit === '%' && newUnit === 'px') {
          boardStore.updateCanvas({ widthUnit: newUnit, width: Math.round(parentWidth * currentWidth / 100) })
          return
        }
      }
    }
    if (key === 'heightUnit') {
      const newUnit = value as CanvasUnit
      const oldUnit = boardStore.canvas.heightUnit ?? 'px'
      if (newUnit !== oldUnit) {
        const currentHeight = boardStore.canvas.height
        const parentHeight = boardStore.getCanvasHeightPx()
        if (oldUnit === 'px' && newUnit === '%' && parentHeight > 0) {
          boardStore.updateCanvas({ heightUnit: newUnit, height: Math.round((currentHeight / parentHeight) * 100 * 100) / 100 })
          return
        } else if (oldUnit === '%' && newUnit === 'px') {
          boardStore.updateCanvas({ heightUnit: newUnit, height: Math.round(parentHeight * currentHeight / 100) })
          return
        }
      }
    }
    boardStore.updateCanvas({ [key]: value })
  }

  return { updateBoardProperty }
}
