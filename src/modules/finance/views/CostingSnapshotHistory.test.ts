import { describe, expect, it, vi } from 'vitest'
import { defineComponent } from 'vue'
import { shallowMount } from '@vue/test-utils'
import CostingSnapshotHistory from '@/modules/finance/views/CostingSnapshotHistory.vue'

vi.mock('@/modules/finance/api', () => ({
  getCostingSnapshotList: vi.fn().mockResolvedValue({
    success: true,
    data: {
      data: [
        {
          id: 1,
          product_id: 26,
          seller_sku: 'SKU-TEST-001',
          product_title: '测试产品',
          cost_type: 'LANDED',
          currency: 'USD',
          unit_cost: 12.3456,
          effective_from: '2026-03-23 10:00:00',
          effective_to: null,
          notes: '测试快照',
          created_at: '2026-03-23 10:00:00'
        }
      ],
      total: 1
    }
  }),
  createCostingSnapshot: vi.fn(),
  updateCostingSnapshot: vi.fn(),
  deleteCostingSnapshot: vi.fn()
}))

const Stub = defineComponent({ inheritAttrs: false, template: '<div><slot /></div>' })
const TableStub = defineComponent({ inheritAttrs: false, template: '<div><slot /></div>' })
const ColumnStub = defineComponent({
  inheritAttrs: false,
  setup(_, { slots }) {
    return () => (slots.default ? slots.default({ row: {} }) : null)
  }
})

describe('CostingSnapshotHistory', () => {
  it('renders snapshot history page title and list table', async () => {
    const wrapper = shallowMount(CostingSnapshotHistory, {
      global: {
        stubs: {
          ProductSelector: Stub,
          'el-form': Stub,
          'el-form-item': Stub,
          'el-select': Stub,
          'el-option': Stub,
          'el-input': Stub,
          'el-input-number': Stub,
          'el-button': Stub,
          'el-date-picker': Stub,
          'el-dialog': Stub,
          'el-table': TableStub,
          'el-table-column': ColumnStub,
          'el-pagination': Stub,
          'el-tag': Stub,
          'el-image': Stub
        },
        directives: {
          loading: {}
        }
      }
    })

    await vi.dynamicImportSettled()
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('成本快照历史')
    expect(wrapper.text()).toContain('有效区间')
  })
})
