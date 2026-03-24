import { describe, expect, it, vi } from 'vitest'
import { defineComponent } from 'vue'
import { shallowMount } from '@vue/test-utils'
import CashLedgerAuditList from '@/modules/finance/views/CashLedgerAuditList.vue'

vi.mock('@/modules/system/api/logs', () => ({
  getSystemAuditLogList: vi.fn().mockResolvedValue({
    success: true,
    data: {
      data: [
        {
          id: 1,
          username: '系统管理员',
          action: 'CREATE',
          entity_type: 'CashLedger',
          created_at: '2026-03-23 10:00:00',
          changes: {}
        }
      ],
      total: 1
    }
  })
}))

vi.mock('@/modules/common/composables/useAuditLogFormatter', () => ({
  useAuditLogFormatter: () => ({
    getActionLabel: () => '新增现金流水',
    formatAuditChanges: () => '金额：0 -> 100'
  })
}))

const Stub = defineComponent({ inheritAttrs: false, template: '<div><slot /></div>' })
const TableStub = defineComponent({ inheritAttrs: false, template: '<div><slot /></div>' })
const ColumnStub = defineComponent({
  inheritAttrs: false,
  setup(_, { slots }) {
    return () => (slots.default ? slots.default({ row: {} }) : null)
  }
})

describe('CashLedgerAuditList', () => {
  it('renders audit page title and log table', async () => {
    const wrapper = shallowMount(CashLedgerAuditList, {
      global: {
        stubs: {
          'el-form': Stub,
          'el-form-item': Stub,
          'el-input': Stub,
          'el-button': Stub,
          'el-date-picker': Stub,
          'el-table': TableStub,
          'el-table-column': ColumnStub,
          'el-pagination': Stub
        },
        directives: {
          loading: {}
        }
      }
    })

    await vi.dynamicImportSettled()
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('现金流水操作日志')
    expect(wrapper.text()).toContain('操作时间')
  })
})
