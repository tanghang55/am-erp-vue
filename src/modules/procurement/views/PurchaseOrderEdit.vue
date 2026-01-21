<template>
  <div class="purchase-order-page">
    <el-card>
      <template #header>
        <el-page-header :content="labels.title" @back="handleBack" />
      </template>
      <PurchaseOrderForm
        mode="edit"
        :order-id="orderId"
        @saved="handleSaved"
        @cancel="handleBack"
      />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useLocaleStore } from '@/modules/common/stores/localeStore'
import PurchaseOrderForm from '@/modules/procurement/components/PurchaseOrderForm.vue'
import type { PurchaseOrder } from '@/modules/procurement/types'

const router = useRouter()
const route = useRoute()
const localeStore = useLocaleStore()
const orderId = Number(route.params.id)

const labels = computed(() => {
  if (localeStore.isEnglish) {
    return { title: 'Edit Purchase Order' }
  }
  return { title: '编辑采购单' }
})

const handleBack = () => {
  router.back()
}

const handleSaved = (order: PurchaseOrder) => {
  router.push(`/procurement/purchase-orders/${order.id}`)
}
</script>

<style scoped>
.purchase-order-page {
  padding: 20px;
}
</style>
