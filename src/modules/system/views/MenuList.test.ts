import { describe, it, expect, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import MenuList from '@/modules/system/views/MenuList.vue'

vi.mock('@/modules/system/api', () => ({
  getMenuList: vi.fn().mockResolvedValue({ success: true, data: { data: [], total: 0 } }),
  createMenu: vi.fn(),
  updateMenu: vi.fn(),
  updateMenuStatus: vi.fn(),
  deleteMenu: vi.fn()
}))

describe('MenuList', () => {
  it('renders keyword input', () => {
    setActivePinia(createPinia())
    const wrapper = shallowMount(MenuList, {
      global: {
        stubs: {
          'el-input': { template: '<input />' },
          'el-card': { template: '<div><slot /></div>' },
          'el-form': { template: '<form><slot /></form>' },
          'el-form-item': { template: '<div><slot /></div>' },
          'el-table': { template: '<div />' },
          'el-table-column': { template: '<div />' },
          'el-pagination': { template: '<div />' },
          'el-drawer': { template: '<div />' },
          'el-button': { template: '<button />' },
          'el-select': { template: '<div />' },
          'el-option': { template: '<div />' },
          'el-switch': { template: '<div />' },
          'el-input-number': { template: '<div />' }
        }
      }
    })
    expect(wrapper.find('input').exists()).toBe(true)
  })
})
