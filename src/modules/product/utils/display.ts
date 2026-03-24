import type { ProductCategory, ProductConfigItem, ProductConfigType, ProductSummary } from '../types'

export const getProductStatusTagType = (status: string) => {
  const types: Record<string, string> = {
    DRAFT: 'info',
    ON_SALE: 'success',
    REPLENISHING: 'warning',
    OFF_SHELF: 'danger'
  }
  return types[status] || 'info'
}

export const formatProductMoney = (value?: string | number | null) => {
  if (value === null || value === undefined || value === '') return '-'
  const parsed = Number(value)
  if (Number.isNaN(parsed)) return String(value)
  return `$${parsed.toFixed(2)}`
}

export const formatProductDateTime = (value?: string) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  const pad = (num: number) => String(num).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export const formatOptionalValue = (value?: string | number | null) => {
  if (value === null || value === undefined || value === '') return '-'
  return String(value)
}

export const findProductCategoryName = (items: ProductCategory[], id?: number): string | undefined => {
  if (!id) return undefined
  for (const item of items) {
    if (item.id === id) return item.category_name
    if (item.children?.length) {
      const nested = findProductCategoryName(item.children, id)
      if (nested) return nested
    }
  }
  return undefined
}

export const findProductCategoryPath = (items: ProductCategory[], id?: number): string | undefined => {
  if (!id) return undefined
  const walk = (nodes: ProductCategory[], trail: string[]): string[] | undefined => {
    for (const node of nodes) {
      const nextTrail = [...trail, node.category_name]
      if (node.id === id) return nextTrail
      if (node.children?.length) {
        const nested = walk(node.children, nextTrail)
        if (nested) return nested
      }
    }
    return undefined
  }

  const path = walk(items, [])
  return path?.join(' / ')
}

type DimensionSource = Partial<ProductSummary> & {
  dimension_unit_id?: number
  dimension_unit_name?: string
}

export const formatProductDimensionSummary = (
  product: DimensionSource,
  configOptionsByType: Record<ProductConfigType, ProductConfigItem[]>
) => {
  const parts = [product.length, product.width, product.height]
    .map((value) => (value === null || value === undefined || value === '' ? '' : String(value)))
    .filter(Boolean)
  if (!parts.length) return '-'
  const unitName =
    product.dimension_unit_name ||
    configOptionsByType.DIMENSION_UNIT.find((item) => item.id === product.dimension_unit_id)?.item_name
  return `${parts.join(' × ')}${unitName ? ` ${unitName}` : ''}`
}
