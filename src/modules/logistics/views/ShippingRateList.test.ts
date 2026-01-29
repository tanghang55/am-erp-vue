import { describe, it, expect, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import ShippingRateList from '@/modules/logistics/views/ShippingRateList.vue'

vi.mock('@/modules/logistics/api', () => ({
  getShippingRates: vi.fn().mockResolvedValue({
    data: {
      data: {
        data: [
          {
            id: 1,
            provider_id: 10,
            transport_mode: 'AIR',
            pricing_method: 'PER_KG',
            base_rate: 3.5,
            currency: 'USD',
            status: 'ACTIVE'
          }
        ],
        total: 1
      }
    }
  }),
  getProviders: vi.fn().mockResolvedValue({
    data: {
      data: {
        data: [
          {
            id: 10,
            provider_name: 'Logistics One'
          }
        ],
        total: 1
      }
    }
  }),
  createShippingRate: vi.fn(),
  updateShippingRate: vi.fn(),
  deleteShippingRate: vi.fn()
}))

vi.mock('@/modules/inventory/api', () => ({
  getActiveWarehouses: vi.fn().mockResolvedValue({
    data: {
      data: []
    }
  })
}))

const Stub = defineComponent({
  template: '<div><slot /></div>'
})

const NoSlotStub = defineComponent({
  template: '<div />'
})

const TableStub = defineComponent({
  props: ['data'],
  template: '<div class="table" :data-count="(data || []).length"></div>'
})

const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0))

describe('ShippingRateList', () => {
  it('loads rate list from paginated data payload', async () => {
    const wrapper = shallowMount(ShippingRateList, {
      global: {
        stubs: {
          'el-card': Stub,
          'el-form': Stub,
          'el-form-item': Stub,
          'el-select': Stub,
          'el-option': Stub,
          'el-input': Stub,
          'el-button': Stub,
          'el-table': TableStub,
          'el-table-column': NoSlotStub,
          'el-pagination': Stub,
          'el-dialog': Stub,
          'el-row': Stub,
          'el-col': Stub,
          'el-input-number': Stub,
          'el-date-picker': Stub,
          'el-tag': Stub
        }
      }
    })

    await flushPromises()
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.table').attributes('data-count')).toBe('1')
  })
})
