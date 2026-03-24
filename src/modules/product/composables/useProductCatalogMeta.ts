import { computed, ref, type Ref } from 'vue'
import { getProductCategoryTree, getProductConfigList } from '../api/configs'
import type {
  ProductCategory,
  ProductConfigItem,
  ProductConfigType,
  ProductSummary
} from '../types'
import {
  findProductCategoryPath,
  findProductCategoryName,
  formatProductDimensionSummary,
  formatProductMoney
} from '../utils/display'

export function useProductCatalogMeta<T extends { unit_cost?: string | number; inventory_available?: number; inventory_reserved?: number; inventory_inbound?: number; deletable?: boolean; delete_block_reason?: string; reference_count?: number }>(
  currentProduct: Ref<T | null>
) {
  const productConfigItems = ref<ProductConfigItem[]>([])
  const categoryTree = ref<ProductCategory[]>([])

  const configOptionsByType = computed<Record<ProductConfigType, ProductConfigItem[]>>(() => ({
    BRAND: productConfigItems.value.filter((item) => item.config_type === 'BRAND' && item.status === 'ACTIVE'),
    SALES_STATUS: productConfigItems.value.filter((item) => item.config_type === 'SALES_STATUS' && item.status === 'ACTIVE'),
    DIMENSION_UNIT: productConfigItems.value.filter((item) => item.config_type === 'DIMENSION_UNIT' && item.status === 'ACTIVE'),
    WEIGHT_UNIT: productConfigItems.value.filter((item) => item.config_type === 'WEIGHT_UNIT' && item.status === 'ACTIVE')
  }))

  const salesStatusOptions = computed(() => {
    const configured = configOptionsByType.value.SALES_STATUS
    if (configured.length > 0) {
      return configured
        .slice()
        .sort((a, b) => a.sort - b.sort || a.id - b.id)
        .map((item) => ({ value: item.item_code, label: item.item_name }))
    }
    return [
      { value: 'DRAFT', label: '草稿' },
      { value: 'ON_SALE', label: '正常销售' },
      { value: 'REPLENISHING', label: '补货中' },
      { value: 'OFF_SHELF', label: '下架' }
    ]
  })

  const currentProductSummaryCards = computed(() => {
    if (!currentProduct.value) return []
    return [
      {
        key: 'available',
        label: '可售库存',
        value: String(currentProduct.value.inventory_available ?? '-'),
        hint: '用于快速判断当前可售量'
      },
      {
        key: 'reserved',
        label: '锁定库存',
        value: String(currentProduct.value.inventory_reserved ?? '-'),
        hint: '已分配未出库'
      },
      {
        key: 'inbound',
        label: '在途库存',
        value: String(currentProduct.value.inventory_inbound ?? '-'),
        hint: '采购或调拨在途'
      },
      {
        key: 'cost',
        label: '默认供应商报价',
        value: formatProductMoney(currentProduct.value.unit_cost),
        hint: '展示默认供应商当前对应的报价'
      },
      {
        key: 'delete',
        label: '删除状态',
        value: currentProduct.value.deletable === false ? '不可删除' : '可删除',
        hint: currentProduct.value.deletable === false
          ? (currentProduct.value.delete_block_reason || `引用 ${currentProduct.value.reference_count ?? 0} 项`)
          : '当前未发现业务引用'
      }
    ]
  })

  const getConfigItemName = (type: ProductConfigType, id?: number) => {
    if (!id) return '-'
    return productConfigItems.value.find((item) => item.config_type === type && item.id === id)?.item_name || '-'
  }
  const getSalesStatusLabel = (code?: string) => {
    if (!code) return '-'
    return salesStatusOptions.value.find((item) => item.value === code)?.label || code
  }

  const getCategoryName = (id?: number) => findProductCategoryName(categoryTree.value, id) || '-'
  const getCategoryPath = (id?: number) => findProductCategoryPath(categoryTree.value, id) || '-'

  const formatDimensionSummary = (product: Partial<ProductSummary>) =>
    formatProductDimensionSummary(product, configOptionsByType.value)

  const formatProductAuditFieldValue = (key: string, value: unknown) => {
    if (value === null || value === undefined || value === '') {
      return '空'
    }
    switch (key) {
      case 'brand_id':
        return getConfigItemName('BRAND', Number(value))
      case 'category_id':
        return getCategoryPath(Number(value))
      case 'dimension_unit_id':
        return getConfigItemName('DIMENSION_UNIT', Number(value))
      case 'weight_unit_id':
        return getConfigItemName('WEIGHT_UNIT', Number(value))
      case 'status':
        return getSalesStatusLabel(String(value))
      case 'is_combo_main':
        return Number(value) === 1 || value === true || value === 'true' ? '是' : '否'
      default:
        return String(value)
    }
  }

  const loadProductConfigs = async () => {
    const res = await getProductConfigList({ page: 1, page_size: 500 })
    if (res.success) {
      productConfigItems.value = Array.isArray(res.data?.data) ? res.data.data : []
    }
  }

  const loadProductCategories = async () => {
    const res = await getProductCategoryTree()
    if (res.success) {
      categoryTree.value = Array.isArray(res.data) ? res.data : []
    }
  }

  return {
    productConfigItems,
    categoryTree,
    configOptionsByType,
    salesStatusOptions,
    currentProductSummaryCards,
    getConfigItemName,
    getSalesStatusLabel,
    getCategoryName,
    getCategoryPath,
    formatDimensionSummary,
    formatProductAuditFieldValue,
    loadProductConfigs,
    loadProductCategories
  }
}
