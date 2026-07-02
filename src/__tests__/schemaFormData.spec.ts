import { describe, it, expect } from 'vitest'
import type { PartialWidget } from '@/widgets/base/types'
import {
  collectSchemaFormData,
  applySchemaFormData,
  collectFormIdValues,
  validateSchemaFields,
} from '@/utils/schemaFormData'

function makeField(type: string, field: string, value: unknown, extra: Partial<PartialWidget> = {}): PartialWidget {
  return { id: field, name: type, type: type as PartialWidget['type'], field, defaultValue: value, ...extra }
}

describe('schemaFormData', () => {
  it('collectSchemaFormData gathers nested field values', () => {
    const schema: PartialWidget[] = [
      {
        id: 'form1',
        name: 'FgForm',
        type: 'form',
        children: [
          makeField('input', 'name', 'Alice'),
          {
            id: 'card1',
            name: 'FgCard',
            type: 'card',
            children: [makeField('number', 'age', 30)],
          },
        ],
      },
      makeField('input', 'note', 'hello'),
    ]

    expect(collectSchemaFormData(schema)).toEqual({
      name: 'Alice',
      age: 30,
      note: 'hello',
    })
  })

  it('applySchemaFormData updates matching defaultValue fields', () => {
    const schema: PartialWidget[] = [
      makeField('input', 'name', 'Alice'),
      makeField('input', 'note', 'old'),
    ]

    applySchemaFormData(schema, { name: 'Bob', note: 'new', missing: 'x' })

    expect(schema[0].defaultValue).toBe('Bob')
    expect(schema[1].defaultValue).toBe('new')
  })

  it('collectFormIdValues only returns widgets bound to formId', () => {
    const schema: PartialWidget[] = [
      makeField('input', 'name', 'Alice', { formId: 'form1' }),
      makeField('input', 'other', 'x', { formId: 'form2' }),
      makeField('input', 'free', 'y'),
    ]

    expect(collectFormIdValues(schema, 'form1')).toEqual({ name: 'Alice' })
  })

  it('validateSchemaFields rejects missing required values', async () => {
    const schema: PartialWidget[] = [
      makeField('input', 'name', undefined, {
        validationRules: [{ required: true, message: '必填' }],
      }),
    ]
    await expect(validateSchemaFields(schema)).rejects.toBeTruthy()
  })

  it('validateSchemaFields passes when required values present', async () => {
    const schema: PartialWidget[] = [
      makeField('input', 'name', 'Alice', {
        validationRules: [{ required: true, message: '必填' }],
      }),
    ]
    await expect(validateSchemaFields(schema)).resolves.toBe(true)
  })
})
