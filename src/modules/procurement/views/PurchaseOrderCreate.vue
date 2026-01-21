<template>
  <div class="purchase-order-page">
    <el-card>
      <template #header>
        <el-page-header :content="labels.title" @back="handleBack" />
      </template>
      <PurchaseOrderForm mode="create" @saved="handleSaved" @cancel="handleBack" />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useLocaleStore } from '@/modules/common/stores/localeStore'
import PurchaseOrderForm from '@/modules/procurement/components/PurchaseOrderForm.vue'
import type { PurchaseOrder } from '@/modules/procurement/types'

const router = useRouter()
const localeStore = useLocaleStore()

const labels = computed(() => {
  if (localeStore.isEnglish) {
    return { title: 'Create Purchase Order' }
  }
  return { title: '新建采购单' }
})

const handleBack = () => {
  router.back()
}

const handleSaved = (order: PurchaseOrder | PurchaseOrder[]) => {
  if (Array.isArray(order)) {
    if (order.length === 1) {
      router.push(`/procurement/purchase-orders/${order[0].id}`)
      return
    }
    router.push('/procurement/purchase-orders')
    return
  }
  router.push(`/procurement/purchase-orders/${order.id}`)
}
</script>

<style scoped>
.purchase-order-page {
  padding: 20px;
}
</style>
