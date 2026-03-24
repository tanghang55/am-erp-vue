import { describe, expect, it, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import FieldLabelList from '@/modules/system/views/FieldLabelList.vue'

vi.mock('@/modules/system/api', () => ({
  getFieldLabelList: vi.fn().mockResolvedValue({
    success: true,
    data: {
      data: [
        {
          id: 1,
          label_key: 'product.list.title',
          labels: {
            'zh-CN': '产品列表',
            'en-US': 'Product List'
          },
          updated_at: '2026-03-10 21:00:00'
        }
      ],
      total: 1
    }
  }),
  createFieldLabel: vi.fn(),
  updateFieldLabel: vi.fn(),
  deleteFieldLabel: vi.fn()
}))

describe('FieldLabelList', () => {
  it('renders chinese page title and without summary cards', async () => {
    const wrapper = shallowMount(FieldLabelList, {
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
          'el-dropdown': { template: '<div><slot /><slot name="dropdown" /></div>' },
          'el-dropdown-menu': { template: '<div><slot /></div>' },
          'el-dropdown-item': { template: '<button><slot /></button>' }
        },
        directives: {
          loading: {}
        }
      }
    })

    await vi.dynamicImportSettled()
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('字段标签')
    expect(wrapper.findAll('[data-testid="field-label-summary-card"]')).toHaveLength(0)
  })
})

