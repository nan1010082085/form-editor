/**
 * useBoardPropertyItems - 画布属性面板配置项构建
 *
 * 从 PropertyPanel 抽出：根据 boardStore.canvas + 布局模式，
 * 组装画布配置面板的属性列表（布局模式/主题/尺寸/背景/缩放/网格）。
 *
 * Free 模式暴露画布尺寸 + 网格配置；Flex 模式隐藏尺寸（恒 100%×100%）+ 暴露 zoom。
 */
import { computed } from 'vue'
import type { TranslateFn } from '@/components/WidgetRenderer/types'
import { useBoardStore } from '@/stores/board'
import { BOARD_THEME_PRESETS } from '@/utils/boardThemes'

export interface BoardPropertyItem {
  key: string
  label: string
  type: string
  value: unknown
  desc?: string
  options?: Array<{ label: string; value: string | number | boolean }>
}

export function useBoardPropertyItems(t: TranslateFn) {
  const boardStore = useBoardStore()

  const unitOptions = computed(() => [
    { label: t('editor.property.unitPx'), value: 'px' },
    { label: t('editor.property.unitPercent'), value: '%' },
  ])

  const boardPropertyItems = computed<BoardPropertyItem[]>(() => {
    const c = boardStore.canvas
    const isFree = (c.layoutMode ?? 'free') === 'free'
    const items: BoardPropertyItem[] = [
      { key: 'layoutMode', label: t('editor.property.layoutMode'), type: 'text', value: isFree ? t('editor.property.layoutModeFree') : t('editor.property.layoutModeFlex'), desc: t('editor.property.layoutModeDesc') },
      {
        key: 'themePreset',
        label: t('editor.property.themePreset'),
        type: 'select',
        value: (c as { themePreset?: string }).themePreset ?? 'default-light',
        desc: t('editor.property.themePresetDesc'),
        options: BOARD_THEME_PRESETS.map(p => ({ label: p.label, value: p.id })),
      },
    ]
    if (isFree) {
      items.push(
        { key: 'freeLayout.maxContentWidth', label: t('editor.property.maxContentWidth'), type: 'number', value: c.freeLayout?.maxContentWidth ?? '', desc: t('editor.property.maxContentWidthDesc') },
        { key: 'freeLayout.contentAlign', label: t('editor.property.contentAlign'), type: 'select', value: c.freeLayout?.contentAlign ?? 'left', options: [
          { label: t('editor.property.alignLeft'), value: 'left' },
          { label: t('editor.property.alignCenter'), value: 'center' },
        ] },
        { key: 'freeLayout.marginX', label: t('editor.property.marginX'), type: 'text', value: c.freeLayout?.marginX ?? '0', desc: t('editor.property.marginXDesc') },
        { key: 'freeLayout.snapToGrid', label: t('editor.property.snapToGrid'), type: 'switch', value: c.freeLayout?.snapToGrid ?? false, desc: t('editor.property.snapToGridDesc') },
        { key: 'freeLayout.gridColumns', label: t('editor.property.gridColumns'), type: 'select', value: c.freeLayout?.gridColumns ?? 24, desc: t('editor.property.gridColumnsDesc'), options: [
          { label: t('editor.property.gridColumns12'), value: 12 },
          { label: t('editor.property.gridColumns24'), value: 24 },
        ] },
        { key: 'freeLayout.gridRowHeight', label: t('editor.property.gridRowHeight'), type: 'number', value: c.freeLayout?.gridRowHeight ?? 8, desc: t('editor.property.gridRowHeightDesc') },
      )
    }
    // 画布尺寸字段仅 free 模式有意义（flex 画布恒 100%×100%，由容器决定）
    if (isFree) {
      items.push(
        { key: 'width', label: t('editor.property.canvasWidth'), type: 'number', value: c.width, desc: t('editor.property.canvasWidthDesc') },
        { key: 'widthUnit', label: t('editor.property.widthUnit'), type: 'select', value: c.widthUnit ?? 'px', desc: t('editor.property.widthUnit'), options: unitOptions.value },
        { key: 'height', label: t('editor.property.canvasHeight'), type: 'number', value: c.height, desc: t('editor.property.canvasHeightDesc') },
        { key: 'heightUnit', label: t('editor.property.heightUnit'), type: 'select', value: c.heightUnit ?? 'px', desc: t('editor.property.heightUnit'), options: unitOptions.value },
      )
    }
    items.push(
      { key: 'backgroundColor', label: t('editor.property.backgroundColor'), type: 'color', value: c.backgroundColor, desc: t('editor.property.backgroundColorDesc') },
      { key: 'padding', label: t('editor.property.padding'), type: 'text', value: c.padding, desc: t('editor.property.paddingDesc') },
    )
    if (!isFree) {
      items.push({ key: 'zoom', label: t('editor.property.zoom'), type: 'number', value: c.zoom, desc: t('editor.property.zoomDesc') })
    }
    return items
  })

  return { boardPropertyItems }
}
