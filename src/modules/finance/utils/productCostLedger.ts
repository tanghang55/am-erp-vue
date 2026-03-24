import type { ProductCostDirection, ProductCostLedgerItem } from '../types'

export const formatProductCostDirection = (value: ProductCostDirection | undefined) => {
  switch (value) {
    case 'INBOUND':
      return '入库'
    case 'OUTBOUND':
      return '出库'
    case 'NEUTRAL':
      return '成本'
    default:
      return value || '-'
  }
}

export const getProductCostDirectionTagType = (value: ProductCostDirection | undefined) => {
  switch (value) {
    case 'INBOUND':
      return 'success'
    case 'OUTBOUND':
      return 'warning'
    case 'NEUTRAL':
      return 'info'
    default:
      return 'info'
  }
}

export const formatProductCostSourceType = (value?: string) => {
  switch (value) {
    case 'PO_RECEIVED':
      return '采购到货'
    case 'PO_ADJUST':
      return '采购调整'
    case 'PACKING_MATERIAL':
      return '打包耗材'
    case 'SHIPMENT_ALLOCATED':
      return '发货分摊'
    case 'SALES_SHIP':
      return '销售出库'
    case 'SALES_RETURN':
      return '销售退回'
    default:
      return value || '-'
  }
}

export const formatProductCostReferenceType = (value?: string | null) => {
  switch (value) {
    case 'PURCHASE_ORDER':
      return '采购单'
    case 'SHIPMENT':
      return '发货单'
    case 'PRODUCT_PACKING':
    case 'PACKING':
      return '打包单'
    case 'SALES_ORDER':
      return '销售单'
    default:
      return value || '-'
  }
}

export interface ProductCostReferenceSummary {
  primary: string
  secondary: string
}

export const getProductCostReferenceSummary = (
  row: Pick<ProductCostLedgerItem, 'source_type' | 'reference_type' | 'reference_id' | 'reference_number'>
): ProductCostReferenceSummary => {
  const sourceLabel = formatProductCostSourceType(row.source_type)
  const referenceTypeLabel = formatProductCostReferenceType(row.reference_type)
  const referenceValue = row.reference_number || row.reference_id

  if (referenceTypeLabel !== '-' && referenceValue) {
    return {
      primary: `${referenceTypeLabel} #${referenceValue}`,
      secondary: sourceLabel
    }
  }

  return {
    primary: sourceLabel,
    secondary: '无关联单据'
  }
}

export const isNeutralProductCostRow = (row: Pick<ProductCostLedgerItem, 'direction'>) => row.direction === 'NEUTRAL'

export const formatProductCostQuantity = (row: Pick<ProductCostLedgerItem, 'direction' | 'quantity'>) => {
  if (isNeutralProductCostRow(row)) {
    return '-'
  }
  return String(row.quantity ?? 0)
}

export const formatProductCostUnitCost = (row: Pick<ProductCostLedgerItem, 'direction' | 'unit_cost_original' | 'original_currency'>) => {
  if (isNeutralProductCostRow(row)) {
    return '-'
  }
  return `${row.original_currency} ${Number(row.unit_cost_original || 0).toFixed(4)}`
}
