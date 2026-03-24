import { reactive, ref } from 'vue'
import type { AuditLog } from '@/modules/system/types'
import { getProductAuditLogs } from '../api/products'

export function useProductAuditLogs() {
  const auditLogs = ref<AuditLog[]>([])
  const auditLoading = ref(false)
  const auditPagination = reactive({
    page: 1,
    page_size: 10,
    total: 0
  })

  const loadAuditLogs = async (productId: number) => {
    auditLoading.value = true
    try {
      const res = await getProductAuditLogs(productId, auditPagination.page, auditPagination.page_size)
      if (res.success) {
        auditLogs.value = res.data.data
        auditPagination.total = res.data.total
      }
    } finally {
      auditLoading.value = false
    }
  }

  const handleAuditPageChange = (productId?: number) => {
    if (!productId) return
    loadAuditLogs(productId)
  }

  return {
    auditLogs,
    auditLoading,
    auditPagination,
    loadAuditLogs,
    handleAuditPageChange
  }
}
