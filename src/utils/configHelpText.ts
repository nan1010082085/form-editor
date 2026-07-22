/**
 * buildConfigHelpText - 根据已声明的 configPanels 拼装配置说明 HTML
 *
 * 从 PropertyPanel 抽出的纯函数：根据 events/linkages/api/variables 面板声明，
 * 返回对应的说明文档 HTML 片段。文案走 i18n。
 */
import type { TranslateFn } from '@/components/WidgetRenderer/types'
import type { ConfigPanelType } from '@/widgets/base/types'

export function buildConfigHelpText(panels: ConfigPanelType[], t: TranslateFn): string {
  const parts: string[] = [`<p><strong>${t('editor.property.helpTitle')}</strong></p>`]
  if (panels.includes('events')) {
    parts.push(`
      <p><strong>${t('editor.property.helpEvents')}</strong></p>
      <p>${t('editor.property.helpEventsDesc')}</p>
      <ul>
        <li><strong>${t('editor.property.helpTrigger')}</strong> - ${t('editor.property.helpTriggerDesc')}</li>
        <li><strong>${t('editor.property.helpCondition')}</strong> - ${t('editor.property.helpConditionDesc')}</li>
        <li><strong>${t('editor.property.helpConfirm')}</strong> - ${t('editor.property.helpConfirmDesc')}</li>
        <li><strong>${t('editor.property.helpAction')}</strong> - ${t('editor.property.helpActionDesc')}</li>
      </ul>
    `)
  }
  if (panels.includes('linkages')) {
    parts.push(`
      <p><strong>${t('editor.property.helpLinkage')}</strong></p>
      <p>${t('editor.property.helpLinkageDesc')}</p>
      <ul>
        <li>${t('editor.property.helpLinkageTypes')}</li>
        <li>${t('editor.property.helpLinkageWatch')}</li>
        <li>${t('editor.property.helpLinkageFallback')}</li>
      </ul>
    `)
  }
  if (panels.includes('api')) {
    parts.push(`
      <p><strong>${t('editor.property.helpApi')}</strong></p>
      <p>${t('editor.property.helpApiDesc')}</p>
      <ul>
        <li>${t('editor.property.helpApiUrl')}</li>
        <li>${t('editor.property.helpApiParams')}</li>
        <li>${t('editor.property.helpApiDynamic')}</li>
      </ul>
    `)
  }
  if (panels.includes('variables')) {
    parts.push(`
      <p><strong>${t('editor.property.helpVariable')}</strong></p>
      <p>${t('editor.property.helpVariableDesc')}</p>
      <ul>
        <li>${t('editor.property.helpVariableExposed')}</li>
        <li>${t('editor.property.helpVariableRef')}</li>
      </ul>
    `)
  }
  return parts.join('')
}
