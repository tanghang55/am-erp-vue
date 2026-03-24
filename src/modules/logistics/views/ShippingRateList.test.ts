import { describe, expect, it, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import ShippingRateList from '@/modules/logistics/views/ShippingRateList.vue'

vi.mock('@/modules/logistics/api', () => ({
  getShippingRates: vi.fn().mockResolvedValue({ success: true, data: { data: [], total: 0 } }),
  createShippingRate: vi.fn(),
  updateShippingRate: vi.fn(),
  deleteShippingRate: vi.fn(),
  getServicesByTransportMode: vi.fn().mockResolvedValue({ success: true, data: [] })
}))

const Stub = defineComponent({ template: '<div><slot /></div>' })
const CardStub = defineComponent({ template: '<div><slot /></div>' })
const TableStub = defineComponent({ template: '<div><slot /></div>' })
const ColumnStub = defineComponent({
  setup(_, { slots }) {
    return () => (slots.default ? slots.default({ row: {} }) : null)
  }
})
const ProviderSelectorStub = defineComponent({
  name: 'ProviderSelector',
  template: '<div class="provider-selector-stub" />'
})
const WarehouseSelectorStub = defineComponent({
  name: 'WarehouseSelector',
  template: '<div class="warehouse-selector-stub" />'
})

describe('ShippingRateList', () => {
  it('renders provider and warehouse selectors', async () => {
    const wrapper = shallowMount(ShippingRateList, {
      global: {
        stubs: {
          'el-card': CardStub,
          'el-form': Stub,
          'el-form-item': Stub,
          'el-table': TableStub,
          'el-table-column': ColumnStub,
          'el-button': Stub,
          'el-input': Stub,
          'el-select': Stub,
          'el-option': Stub,
          'el-tag': Stub,
          'el-dialog': Stub,
          'el-pagination': Stub,
          'el-row': Stub,
          'el-col': Stub,
          'el-input-number': Stub,
          'el-date-picker': Stub,
          ProviderSelector: ProviderSelectorStub,
          WarehouseSelector: WarehouseSelectorStub
        },
        directives: {
          loading: () => {}
        }
      }
    })

    await wrapper.vm.$nextTick()

    expect(wrapper.findAll('.provider-selector-stub').length).toBeGreaterThan(0)
    expect(wrapper.findAll('.warehouse-selector-stub').length).toBeGreaterThan(0)
  })
})
