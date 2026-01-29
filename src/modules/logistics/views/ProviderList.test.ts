import { describe, it, expect, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import ProviderList from '@/modules/logistics/views/ProviderList.vue'

vi.mock('@/modules/logistics/api', () => ({
  getProviders: vi.fn().mockResolvedValue({
    data: {
      data: {
        data: [
          {
            id: 1,
            provider_code: 'LP001',
            provider_name: 'Logistics One',
            provider_type: 'COURIER',
            status: 'ACTIVE'
          }
        ],
        total: 1
      }
    }
  }),
  createProvider: vi.fn(),
  updateProvider: vi.fn(),
  deleteProvider: vi.fn()
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

const InputStub = defineComponent({
  props: ['placeholder'],
  template: '<input :placeholder="placeholder" />'
})

const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0))

describe('ProviderList', () => {
  it('loads provider list from paginated data payload', async () => {
    const wrapper = shallowMount(ProviderList, {
      global: {
        stubs: {
          'el-card': Stub,
          'el-form': Stub,
          'el-form-item': Stub,
          'el-select': Stub,
          'el-option': Stub,
          'el-input': InputStub,
          'el-button': Stub,
          'el-table': TableStub,
          'el-table-column': NoSlotStub,
          'el-pagination': Stub,
          'el-dialog': Stub,
          'el-input-number': Stub,
          'el-radio-group': Stub,
          'el-radio': Stub,
          'el-tag': Stub
        }
      }
    })

    await flushPromises()
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.table').attributes('data-count')).toBe('1')
  })
})
