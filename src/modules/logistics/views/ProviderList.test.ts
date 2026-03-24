import { describe, it, expect, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import ProviderList from '@/modules/logistics/views/ProviderList.vue'

vi.mock('@/modules/logistics/api', () => ({
  getProviders: vi.fn().mockResolvedValue({
    success: true,
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
  }),
  createProvider: vi.fn(),
  updateProvider: vi.fn(),
  deleteProvider: vi.fn()
}))

const CardStub = defineComponent({ template: '<div><slot name="header" /><slot /></div>' })
const Stub = defineComponent({ template: '<div><slot /></div>' })

const ColumnStub = defineComponent({
  setup(_, { slots }) {
    return () =>
      slots.default
        ? slots.default({
            row: {
              id: 1,
              provider_code: 'LP001',
              provider_name: 'Logistics One',
              provider_type: 'COURIER',
              status: 'ACTIVE'
            }
          })
        : null
  }
})

const TableStub = defineComponent({
  props: ['data'],
  template: '<div class="table" :data-count="(data || []).length"><slot /></div>'
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
          'el-card': CardStub,
          'el-form': Stub,
          'el-form-item': Stub,
          'el-select': Stub,
          'el-option': Stub,
          'el-input': InputStub,
          'el-button': Stub,
          'el-table': TableStub,
          'el-table-column': ColumnStub,
          'el-pagination': Stub,
          'el-dialog': Stub,
          'el-input-number': Stub,
          'el-radio-group': Stub,
          'el-radio': Stub,
          'el-tag': Stub,
          'el-icon': Stub,
          'el-dropdown': Stub,
          'el-dropdown-menu': Stub,
          'el-dropdown-item': Stub
        }
      }
    })

    await flushPromises()
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.table').attributes('data-count')).toBe('1')
  })

  it('renders chinese header without summary cards', async () => {
    const wrapper = shallowMount(ProviderList, {
      global: {
        stubs: {
          'el-card': CardStub,
          'el-form': Stub,
          'el-form-item': Stub,
          'el-select': Stub,
          'el-option': Stub,
          'el-input': InputStub,
          'el-button': Stub,
          'el-table': TableStub,
          'el-table-column': ColumnStub,
          'el-pagination': Stub,
          'el-dialog': Stub,
          'el-input-number': Stub,
          'el-radio-group': Stub,
          'el-radio': Stub,
          'el-tag': Stub,
          'el-icon': Stub,
          'el-dropdown': Stub,
          'el-dropdown-menu': Stub,
          'el-dropdown-item': Stub
        }
      }
    })

    await flushPromises()
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('物流商管理')
    expect(wrapper.text()).toContain('查看详情')
    expect(wrapper.findAll('[data-testid="provider-summary-card"]')).toHaveLength(0)
  })
})
