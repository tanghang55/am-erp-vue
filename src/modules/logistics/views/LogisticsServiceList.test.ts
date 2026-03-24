import { describe, expect, it, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import LogisticsServiceList from '@/modules/logistics/views/LogisticsServiceList.vue'

vi.mock('@/modules/logistics/api', () => ({
  getLogisticsServices: vi.fn().mockResolvedValue({
    success: true,
    data: {
      data: [
        {
          id: 1,
          service_code: 'SEA_SLOW_US',
          service_name: '美国慢船',
          transport_mode: 'SEA',
          status: 'ACTIVE'
        }
      ],
      total: 1
    }
  }),
  createLogisticsService: vi.fn(),
  updateLogisticsService: vi.fn(),
  deleteLogisticsService: vi.fn()
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
              service_code: 'SEA_SLOW_US',
              service_name: '美国慢船',
              transport_mode: 'SEA',
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

const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0))

describe('LogisticsServiceList', () => {
  it('renders chinese header without summary cards', async () => {
    const wrapper = shallowMount(LogisticsServiceList, {
      global: {
        stubs: {
          'el-card': CardStub,
          'el-form': Stub,
          'el-form-item': Stub,
          'el-select': Stub,
          'el-option': Stub,
          'el-input': Stub,
          'el-button': Stub,
          'el-table': TableStub,
          'el-table-column': ColumnStub,
          'el-pagination': Stub,
          'el-dialog': Stub,
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

    expect(wrapper.text()).toContain('物流服务管理')
    expect(wrapper.text()).toContain('查看详情')
    expect(wrapper.find('.table').attributes('data-count')).toBe('1')
    expect(wrapper.findAll('[data-testid="service-summary-card"]')).toHaveLength(0)
  })
})
