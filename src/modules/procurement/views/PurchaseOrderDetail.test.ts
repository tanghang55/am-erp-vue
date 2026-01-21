import { describe, it, expect, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { defineComponent } from 'vue'
import PurchaseOrderDetail from '@/modules/procurement/views/PurchaseOrderDetail.vue'
import { useLocaleStore } from '@/modules/common/stores/localeStore'

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
  getPurchaseOrderDetail: vi.fn().mockResolvedValue({ success: true, data: {} }),
  submitPurchaseOrder: vi.fn(),
  markPurchaseOrderShipped: vi.fn(),
  receivePurchaseOrder: vi.fn(),
  closePurchaseOrder: vi.fn()
}))

const CardStub = defineComponent({ template: '<div><slot name="header" /><slot /></div>' })
const Stub = defineComponent({ template: '<div><slot /></div>' })
const PageHeaderStub = defineComponent({
  props: ['content'],
  template: '<div>{{ content }}</div>'
})
const TableStub = defineComponent({ template: '<div><slot /></div>' })
const ColumnStub = defineComponent({
  setup(_, { slots }) {
    return () => (slots.default ? slots.default({ row: {} }) : null)
  }
})

describe('PurchaseOrderDetail', () => {
  it('renders detail title', async () => {
    setActivePinia(createPinia())
    const localeStore = useLocaleStore()
    localeStore.setLocale('zh-CN')

    const wrapper = shallowMount(PurchaseOrderDetail, {
      global: {
        stubs: {
          'el-card': CardStub,
          'el-button': Stub,
          'el-page-header': PageHeaderStub,
          'el-tag': Stub,
          'el-table': TableStub,
          'el-table-column': ColumnStub,
          'el-descriptions': Stub,
          'el-descriptions-item': Stub,
          'el-dialog': Stub,
          'el-form': Stub,
          'el-form-item': Stub,
          'el-input-number': Stub,
          'el-divider': Stub,
          WarehouseSelector: Stub
        }
      }
    })

    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('采购单详情')
  })
})
