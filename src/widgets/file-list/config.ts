import type { WidgetConfig } from '../base/types'

export const fileListConfig: WidgetConfig = {
  name: 'FgFileList',
  displayName: '附件面板',
  description: '附件列表面板，展示已选文件并支持本地选择与删除（复杂上传场景请用「文件上传」字段）',
  author: 'yangdongnan',
  defaultStyle: { width: '100%', height: '200px' },
  exposedValues: [
    { key: 'value', type: 'array', description: '文件列表数据' },
  ],
  configPanels: ['events', 'api', 'variables'],
  defaultProps: {
    title: '附件',
    allowDelete: true,
    allowPreview: false,
    buttonText: '选择文件',
  },
  propertyPanel: {
    basic: ['label'],
    style: [],
    props: [
      { key: 'title', label: '标题', type: 'input', default: '附件' },
      { key: 'buttonText', label: '按钮文字', type: 'input', default: '选择文件' },
      { key: 'allowDelete', label: '允许删除', type: 'switch', default: true },
      { key: 'allowPreview', label: '允许预览', type: 'switch', default: false },
      { key: 'accept', label: '文件类型', type: 'input', placeholder: '.jpg,.png,.pdf' },
      { key: 'multiple', label: '多选', type: 'switch', default: true },
    ],
  },
}
