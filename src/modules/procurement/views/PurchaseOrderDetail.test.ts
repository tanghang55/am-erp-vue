import { describe, it, expect, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { defineComponent } from 'vue'
import PurchaseOrderDetail from '@/modules/procurement/views/PurchaseOrderDetail.vue'
import { useLocaleStore } from '@/modules/common/stores/localeStore'

vi.mock('@/modules/system/api/logs', () => ({
  getSystemAuditLogList: vi.fn().mockResolvedValue({
    data: {
      data: [
        {
          id: 1,
          module: 'Procurement',
          action: 'CLOSE',
          entity_type: 'PurchaseOrder',
          entity_id: '8',
          username: 'admin',
          created_at: '2026-03-14T14:00:00+08:00',
          changes: '{"before":{"status":"RECEIVED"},"after":{"status":"CLOSED"}}'
        }
      ],
      total: 1,
      page: 1,
      page_size: 10
    }
  })
}))

vi.mock('@/modules/common/composables/useAuditLogFormatter', () => ({
  useAuditLogFormatter: () => ({
    getActionLabel: (action: string) => action,
    formatAuditChanges: () => '状态【已收货】=>【已完成】',
    getChangeRows: () => []
  })
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn()
  }),
  useRoute: () => ({
    params: { id: '8' }
  })
}))

vi.mock('@/modules/procurement/api', () => ({
  getPurchaseOrderDetail: vi.fn().mockResolvedValue({
    success: true,
    data: {
      id: 8,
      po_number: 'PO-TEST-0008',
      supplier_id: 1,
      marketplace: 'US',
      status: 'SHIPPED',
      currency: 'USD',
      total_amount: '10',
      created_at: '2026-03-14T10:00:00+08:00',
      ordered_at: '2026-03-14T11:00:00+08:00',
      shipped_at: '2026-03-14T12:00:00+08:00',
      received_at: '',
      closed_at: '',
      warehouse_id: 5,
      supplier: { id: 1, name: '供应商A' },
      items: [
        {
          id: 81,
          product_id: 101,
          qty_ordered: 10,
          qty_received: 4,
          unit_cost: '3.5',
          subtotal: '35',
          product: {
            id: 101,
            seller_sku: 'SKU-101',
            title: 'Test Product 101'
          }
        }
      ]
    }
  }),
  submitPurchaseOrder: vi.fn(),
  markPurchaseOrderShipped: vi.fn(),
  receivePurchaseOrder: vi.fn(),
  closePurchaseOrder: vi.fn()
}))

const CardStub = defineComponent({ template: '<div><slot name="header" /><slot /></div>' })
const Stub = defineComponent({ template: '<div><slot /></div>' })
const ButtonStub = defineComponent({
  emits: ['click'],
  template: '<button @click="$emit(`click`)"><slot /></button>'
})
const PageHeaderStub = defineComponent({
  props: ['content'],
  template: '<div>{{ content }}</div>'
})
const TableStub = defineComponent({ template: '<div><slot /></div>' })
const TabsStub = defineComponent({ template: '<div><slot /></div>' })
const TabPaneStub = defineComponent({
  props: ['label'],
  template: '<div><span>{{ label }}</span><slot /></div>'
})
const ColumnStub = defineComponent({
  setup(_, { slots }) {
    return () => (slots.default ? slots.default({ row: {} }) : null)
  }
})
const DialogStub = defineComponent({
  props: ['modelValue'],
  template: '<div v-if="modelValue"><slot /><slot name="footer" /></div>'
})
const WarehouseSelectorStub = defineComponent({
  props: ['modelValue', 'disabled'],
  template: '<div class="warehouse-selector-stub" :data-model-value="modelValue" :data-disabled="disabled"></div>'
})
const InputNumberStub = defineComponent({
  props: ['modelValue', 'max'],
  template: '<div class="input-number-stub" :data-model-value="modelValue" :data-max="max"></div>'
})

describe('PurchaseOrderDetail', () => {
  it('renders detail title and timeline labels', async () => {
    setActivePinia(createPinia())
    const localeStore = useLocaleStore()
    localeStore.setLocale('zh-CN')

    const wrapper = shallowMount(PurchaseOrderDetail, {
      global: {
        stubs: {
          'el-card': CardStub,
          'el-button': ButtonStub,
          'el-page-header': PageHeaderStub,
          'el-tag': Stub,
          'el-tabs': TabsStub,
          'el-tab-pane': TabPaneStub,
          'el-table': TableStub,
          'el-table-column': ColumnStub,
          'el-descriptions': Stub,
          'el-descriptions-item': Stub,
          'el-dialog': DialogStub,
          'el-form': Stub,
          'el-form-item': Stub,
          'el-input-number': InputNumberStub,
          'el-divider': Stub,
          'el-pagination': Stub,
          WarehouseSelector: WarehouseSelectorStub
        }
      }
    })

    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('采购单详情')
    expect(wrapper.text()).toContain('创建时间')
    expect(wrapper.text()).toContain('完成时间')
    expect(wrapper.text()).toContain('操作日志')
  })

  it('reuses shipped warehouse and defaults receive qty to remaining amount', async () => {
    setActivePinia(createPinia())
    const localeStore = useLocaleStore()
    localeStore.setLocale('zh-CN')

    const wrapper = shallowMount(PurchaseOrderDetail, {
      global: {
        stubs: {
          'el-card': CardStub,
          'el-button': ButtonStub,
          'el-page-header': PageHeaderStub,
          'el-tag': Stub,
          'el-tabs': TabsStub,
          'el-tab-pane': TabPaneStub,
          'el-table': TableStub,
          'el-table-column': ColumnStub,
          'el-descriptions': Stub,
          'el-descriptions-item': Stub,
          'el-dialog': DialogStub,
          'el-form': Stub,
          'el-form-item': Stub,
          'el-input-number': InputNumberStub,
          'el-divider': Stub,
          'el-pagination': Stub,
          WarehouseSelector: WarehouseSelectorStub
        }
      }
    })

    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()

    const receiveButton = wrapper.findAll('button').find((button) => button.text().includes('到货验收'))
    expect(receiveButton).toBeTruthy()
    await receiveButton!.trigger('click')
    await wrapper.vm.$nextTick()

    const warehouseSelector = wrapper.find('.warehouse-selector-stub')
    expect(warehouseSelector.attributes('data-model-value')).toBe('5')
    expect(warehouseSelector.attributes('data-disabled')).toBe('true')

    const inputNumber = wrapper.find('.input-number-stub')
    expect(inputNumber.attributes('data-model-value')).toBe('6')
    expect(inputNumber.attributes('data-max')).toBe('6')
  })
})
