import type { WidgetConfig } from '../base/types'

export const uploadConfig: WidgetConfig = {
  name: 'FgUpload',
  displayName: '文件上传',
  description: '表单文件上传字段，支持文件列表展示、数量与大小限制',
  author: 'yangdongnan',
  defaultStyle: {
    width: '240px',
    height: '80px',
  },
  defaultProps: {
    accept: '',
    multiple: false,
    maxSize: 10,
    limit: 5,
    buttonText: '点击上传',
    listType: 'text',
  },
  exposedValues: [
    { key: 'value', type: 'array', description: '已选文件列表', example: [] },
  ],
  configPanels: ['events', 'linkages', 'variables'] as const,
  propertyPanel: {
    basic: ['field', 'label'],
    style: [],
    props: [
      { key: 'placeholder', label: '占位说明', type: 'input', default: '' },
      { key: 'accept', label: '文件类型', type: 'input', placeholder: '.jpg,.png,.pdf' },
      { key: 'multiple', label: '多选', type: 'switch', default: false },
      { key: 'limit', label: '最大数量', type: 'number', default: 5 },
      { key: 'maxSize', label: '单文件上限(MB)', type: 'number', default: 10 },
      { key: 'buttonText', label: '按钮文字', type: 'input', default: '点击上传' },
      {
        key: 'listType',
        label: '列表样式',
        type: 'select',
        default: 'text',
        options: [
          { label: '文字列表', value: 'text' },
          { label: '图片缩略图', value: 'picture' },
          { label: '卡片缩略图', value: 'picture-card' },
        ],
      },
    ],
  },
}
