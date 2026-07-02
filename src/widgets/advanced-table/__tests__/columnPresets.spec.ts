import { describe, expect, it } from 'vitest'
import { COLUMN_PRESETS } from '../columnPresets'

describe('columnPresets (E-35)', () => {
  it('includes leave, expense and audit presets', () => {
    const ids = COLUMN_PRESETS.map((p) => p.id)
    expect(ids).toContain('leave-ledger')
    expect(ids).toContain('expense-ledger')
    expect(ids).toContain('audit-issues')
  })

  it('each preset has action column with buttons render', () => {
    for (const preset of COLUMN_PRESETS) {
      const action = preset.columns.find((c) => c.prop === 'action')
      expect(action?.render).toBe('buttons')
    }
  })
})
