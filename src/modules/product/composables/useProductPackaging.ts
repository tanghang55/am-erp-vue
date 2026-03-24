import { ref } from 'vue'
import { getPackagingItemList } from '@/modules/packaging/api'
import type { PackagingItem } from '@/modules/packaging/types'
import { getProductPackagingItems, saveProductPackagingItems } from '../api/packaging'
import type { ProductPackagingItem } from '../types'

export type ProductPackagingFormItem = ProductPackagingItem & {
  _packagingDetail?: PackagingItem
}

export function useProductPackaging() {
  const packagingItems = ref<ProductPackagingFormItem[]>([])
  const availablePackagingItems = ref<PackagingItem[]>([])

  const resetPackagingItems = () => {
    packagingItems.value = []
  }

  const loadAvailablePackagingItems = async () => {
    try {
      const res = await getPackagingItemList({
        status: 'ACTIVE',
        page: 1,
        page_size: 1000
      })
      availablePackagingItems.value = res.data?.data || []
    } catch (error: any) {
      console.error('加载包材列表失败:', error)
    }
  }

  const loadProductPackagingItems = async (productId: number) => {
    try {
      const res = await getProductPackagingItems(productId)
      const items = Array.isArray(res.data) ? res.data : []
      packagingItems.value = items.map((item) => ({
        ...item,
        _packagingDetail: availablePackagingItems.value.find((packaging) => packaging.id === item.packaging_item_id)
      }))
    } catch (error: any) {
      console.error('加载产品包材配置失败:', error)
      packagingItems.value = []
    }
  }

  const handleAddPackagingItem = () => {
    packagingItems.value.push({
      packaging_item_id: 0,
      quantity_per_unit: 0
    })
  }

  const handleRemovePackagingItem = (index: number) => {
    packagingItems.value.splice(index, 1)
  }

  const handlePackagingItemSelect = (row: ProductPackagingFormItem) => {
    const selected = availablePackagingItems.value.find((item) => item.id === row.packaging_item_id)
    if (selected) {
      row._packagingDetail = selected
    }
  }

  const savePackagingItems = async (productId: number) => {
    if (!productId) return
    const validItems = packagingItems.value
      .filter((item) => item.packaging_item_id && item.quantity_per_unit > 0)
      .map((item) => ({
        packaging_item_id: item.packaging_item_id,
        quantity_per_unit: item.quantity_per_unit
      }))
    if (validItems.length === 0) return
    await saveProductPackagingItems(productId, { packaging_items: validItems })
  }

  return {
    packagingItems,
    availablePackagingItems,
    resetPackagingItems,
    loadAvailablePackagingItems,
    loadProductPackagingItems,
    handleAddPackagingItem,
    handleRemovePackagingItem,
    handlePackagingItemSelect,
    savePackagingItems
  }
}
