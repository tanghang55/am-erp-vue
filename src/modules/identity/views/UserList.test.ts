import { describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { shallowMount } from '@vue/test-utils'
import UserList from '@/modules/identity/views/UserList.vue'

vi.mock('@/modules/identity/api/system', () => ({
  getUserList: vi.fn().mockResolvedValue({
    data: {
      data: [{ id: 1, username: 'admin', real_name: '管理员', email: 'admin@example.com', phone: '13800000000', status: 'ACTIVE', gmt_create: '2026-03-10 10:00:00', gmt_modified: '2026-03-10 10:00:00', last_login_at: '2026-03-10 11:00:00' }],
      total: 1
    }
  }),
  getUserDetail: vi.fn().mockResolvedValue({
    data: {
      user: { id: 1, username: 'admin', real_name: '管理员', email: 'admin@example.com', phone: '13800000000', status: 'ACTIVE', gmt_create: '2026-03-10 10:00:00', gmt_modified: '2026-03-10 10:00:00', last_login_at: '2026-03-10 11:00:00' },
      roles: [],
      permissions: []
    }
  }),
  createUser: vi.fn(),
  updateUser: vi.fn(),
  deleteUser: vi.fn()
}))

vi.mock('@/modules/identity/stores/authStore', () => ({
  useAuthStore: () => ({
    user: { id: 99 }
  })
}))

describe('UserList', () => {
  it('renders chinese page title and without summary cards', async () => {
    setActivePinia(createPinia())
    const wrapper = shallowMount(UserList, {
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
          'el-radio-group': { template: '<div><slot /></div>' },
          'el-radio': { template: '<label><slot /></label>' },
          'el-tag': { template: '<span><slot /></span>' },
          'el-dropdown': { template: '<div><slot /><slot name="dropdown" /></div>' },
          'el-dropdown-menu': { template: '<div><slot /></div>' },
          'el-dropdown-item': { template: '<button><slot /></button>' },
          'el-icon': { template: '<i><slot /></i>' },
          Plus: { template: '<i />' }
        },
        directives: {
          loading: {}
        }
      }
    })

    await vi.dynamicImportSettled()
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('用户管理')
    expect(wrapper.findAll('[data-testid="user-summary-card"]')).toHaveLength(0)
  })
})

