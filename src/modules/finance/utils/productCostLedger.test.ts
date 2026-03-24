import { describe, expect, it } from 'vitest'
import {
  formatProductCostDirection,
  formatProductCostQuantity,
  formatProductCostReferenceType,
  formatProductCostSourceType,
  formatProductCostUnitCost,
  getProductCostDirectionTagType,
  getProductCostReferenceSummary
} from './productCostLedger'

describe('productCostLedger utils', () => {
  it('formats neutral direction as cost', () => {
    expect(formatProductCostDirection('NEUTRAL')).toBe('成本')
    expect(getProductCostDirectionTagType('NEUTRAL')).toBe('info')
  })

  it('hides quantity and unit cost for neutral cost rows', () => {
    expect(formatProductCostQuantity({ direction: 'NEUTRAL', quantity: 0 })).toBe('-')
    expect(formatProductCostUnitCost({ direction: 'NEUTRAL', unit_cost_original: 0, original_currency: 'USD' })).toBe('-')
  })

  it('keeps readable source labels', () => {
    expect(formatProductCostSourceType('PACKING_MATERIAL')).toBe('打包耗材')
    expect(formatProductCostSourceType('SHIPMENT_ALLOCATED')).toBe('发货分摊')
    expect(formatProductCostReferenceType('SHIPMENT')).toBe('发货单')
  })

  it('builds readable reference summary', () => {
    expect(
      getProductCostReferenceSummary({
        source_type: 'PACKING_MATERIAL',
        reference_type: 'PACKING',
        reference_id: 273,
        reference_number: 'PACK-VERIFY-001'
      })
    ).toEqual({
      primary: '打包单 #PACK-VERIFY-001',
      secondary: '打包耗材'
    })

    expect(
      getProductCostReferenceSummary({
        source_type: 'SHIPMENT_ALLOCATED',
        reference_type: 'SHIPMENT',
        reference_id: 38,
        reference_number: null
      })
    ).toEqual({
      primary: '发货单 #38',
      secondary: '发货分摊'
    })
  })
})
