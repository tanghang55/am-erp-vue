import { describe, expect, it, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import MenuList from '@/modules/system/views/MenuList.vue'

vi.mock('@/modules/system/api', () => ({
  getMenuList: vi.fn().mockResolvedValue({
    success: true,
    data: {
      data: [
        {
          id: 1,
          title: '系统管理',
          title_en: 'System',
          code: 'SYSTEM',
          parent_title: null,
          full_path: '/system',
          path: '/system',
          component: 'Layout',
          icon: 'Setting',
          permission_code: 'system.manage',
          status: 'ACTIVE',
          is_hidden: 0,
          sort: 10
        }
      ],
      total: 1
    }
  }),
  createMenu: vi.fn(),
  updateMenu: vi.fn(),
  updateMenuStatus: vi.fn(),
  deleteMenu: vi.fn()
}))

describe('MenuList', () => {
  it('renders chinese page title and without summary cards', async () => {
    const wrapper = shallowMount(MenuList, {
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
          'el-switch': { template: '<div />' },
          'el-input-number': { template: '<div />' },
          'el-tag': { template: '<span><slot /></span>' },
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

    expect(wrapper.text()).toContain('菜单管理')
    expect(wrapper.findAll('[data-testid="menu-summary-card"]')).toHaveLength(0)
  })
})

