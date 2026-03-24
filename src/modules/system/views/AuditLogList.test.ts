import { describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { shallowMount } from '@vue/test-utils'
import AuditLogList from '@/modules/system/views/AuditLogList.vue'

vi.mock('@/modules/common/stores/localeStore', () => ({
  useLocaleStore: () => ({
    locale: 'zh-CN'
  })
}))

vi.mock('@/modules/common/stores/fieldLabelStore', () => ({
  useFieldLabelStore: () => ({
    ensureLoaded: vi.fn().mockResolvedValue(undefined),
    getLabel: (key: string) => key
  })
}))

vi.mock('@/modules/system/api', () => ({
  getSystemAuditLogList: vi.fn().mockResolvedValue({
    success: true,
    data: {
      data: [
        {
          id: 1,
          trace_id: 'TRACE202603102100',
          user_id: 1,
          username: 'admin',
          module: 'System',
          action: 'UPDATE',
          entity_type: 'Menu',
          entity_id: '10',
          changes: '{"before":{"title":"旧菜单"},"after":{"title":"新菜单"}}',
          ip_address: '127.0.0.1',
          user_agent: 'Vitest',
          created_at: '2026-03-10 21:00:00',
          updated_at: '2026-03-10 21:00:00'
        }
      ],
      total: 1
    }
  })
}))

vi.mock('@/modules/common/composables/useAuditLogFormatter', () => ({
  useAuditLogFormatter: () => ({
    formatAuditSummary: () => 'admin 修改了 菜单标题',
    getActionLabel: () => '编辑菜单',
    getChangeRows: () => [{ key: '标题', before: '旧菜单', after: '新菜单' }],
    getEntityTypeLabel: () => '菜单'
  })
}))

describe('AuditLogList', () => {
  it('renders chinese page title and without summary cards', async () => {
    setActivePinia(createPinia())
    const wrapper = shallowMount(AuditLogList, {
      global: {
        stubs: {
          'el-input': { template: '<input />' },
          'el-card': { template: '<div><slot name="header" /><slot /></div>' },
          'el-form': { template: '<form><slot /></form>' },
          'el-form-item': { template: '<div><slot /></div>' },
          'el-table': { template: '<div><slot /></div>' },
          'el-table-column': { template: '<div />' },
          'el-pagination': { template: '<div />' },
          'el-dialog': { template: '<div><slot /><slot name="footer" /></div>' },
          'el-button': { template: '<button><slot /></button>' },
          'el-select': { template: '<div><slot /></div>' },
          'el-option': { template: '<div />' },
          'el-date-picker': { template: '<div />' },
          'el-tag': { template: '<span><slot /></span>' }
        },
        directives: {
          loading: {}
        }
      }
    })

    await vi.dynamicImportSettled()
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('操作日志')
    expect(wrapper.findAll('[data-testid="audit-log-summary-card"]')).toHaveLength(0)
  })
})

