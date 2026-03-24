import { describe, expect, it, vi } from 'vitest'
import { defineComponent } from 'vue'
import { shallowMount } from '@vue/test-utils'
import ExchangeRateList from '@/modules/finance/views/ExchangeRateList.vue'

vi.mock('@/modules/finance/api', () => ({
  getExchangeRateList: vi.fn().mockResolvedValue({
    success: true,
    data: {
      data: [
        {
          id: 1,
          from_currency: 'CNY',
          to_currency: 'USD',
          rate: 0.1386,
          source_type: 'MANUAL',
          source_version: 'v1',
          effective_at: '2026-03-10 12:00:00',
          status: 'ACTIVE',
          remark: '测试汇率',
          created_by: 1,
          updated_by: 1,
          created_at: '2026-03-10 12:00:00',
          updated_at: '2026-03-10 12:00:00'
        }
      ],
      total: 1,
      page: 1,
      page_size: 20
    }
  }),
  createExchangeRate: vi.fn(),
  updateExchangeRateStatus: vi.fn()
}))

vi.mock('@/modules/finance/composables/useFinanceBaseCurrency', () => ({
  useFinanceBaseCurrency: () => ({
    exchangeRateScale: { value: 4 },
    loadFinanceConfig: vi.fn().mockResolvedValue(undefined)
  })
}))

const CardStub = defineComponent({ template: '<div><slot name="header" /><slot /></div>' })
const Stub = defineComponent({ inheritAttrs: false, template: '<div><slot /></div>' })
const TableStub = defineComponent({ inheritAttrs: false, template: '<div><slot /></div>' })
const ColumnStub = defineComponent({
  inheritAttrs: false,
  setup(_, { slots }) {
    return () => (slots.default ? slots.default({ row: {} }) : null)
  }
})

describe('ExchangeRateList', () => {
  it('renders chinese page title and without summary cards', async () => {
    const wrapper = shallowMount(ExchangeRateList, {
      global: {
        stubs: {
          'el-card': CardStub,
          'el-form': Stub,
          'el-form-item': Stub,
          'el-table': TableStub,
          'el-table-column': ColumnStub,
          'el-pagination': Stub,
          'el-dialog': Stub,
          'el-button': Stub,
          'el-select': Stub,
          'el-option': Stub,
          'el-input': Stub,
          'el-input-number': Stub,
          'el-date-picker': Stub,
          'el-tag': Stub
        },
        directives: {
          loading: {}
        }
      }
    })

    await vi.dynamicImportSettled()
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('汇率管理')
    expect(wrapper.findAll('[data-testid="exchange-rate-summary-card"]')).toHaveLength(0)
    expect(wrapper.text()).toContain('查看详情')
    expect((wrapper.vm as unknown as { list: Array<unknown> }).list).toHaveLength(1)
  })
})

