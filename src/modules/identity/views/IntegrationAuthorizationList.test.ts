import { describe, expect, it, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import IntegrationAuthorizationList from '@/modules/identity/views/IntegrationAuthorizationList.vue'

vi.mock('@/modules/identity/api/system', () => ({
  getIntegrationProviderList: vi.fn().mockResolvedValue({
    data: [{ code: 'AMAZON_US', type: 'amazon', display_name: 'Amazon US' }]
  }),
  getIntegrationAuthorizationList: vi.fn().mockResolvedValue({
    data: {
      data: [
        {
          id: 1,
          provider_code: 'AMAZON_US',
          provider_type: 'amazon',
          account_alias: '美国主店',
          seller_partner_id: 'A1TEST',
          status: 'AUTHORIZED',
          access_token_expire_at: '2026-03-11 10:00:00',
          last_authorized_at: '2026-03-10 10:00:00',
          last_refresh_at: '2026-03-10 12:00:00',
          last_error_message: null,
          created_at: '2026-03-10 09:00:00',
          updated_at: '2026-03-10 12:00:00'
        }
      ],
      total: 1
    }
  }),
  startIntegrationAuthorization: vi.fn(),
  refreshIntegrationAuthorization: vi.fn(),
  getIntegrationSKUMappingList: vi.fn(),
  createIntegrationSKUMapping: vi.fn(),
  updateIntegrationSKUMapping: vi.fn(),
  searchProductOptions: vi.fn()
}))

describe('IntegrationAuthorizationList', () => {
  it('renders chinese page title and without summary cards', async () => {
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener').mockImplementation(() => {})
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener').mockImplementation(() => {})

    const wrapper = shallowMount(IntegrationAuthorizationList, {
      global: {
        stubs: {
          'el-card': { template: '<div><slot name="header" /><slot /></div>' },
          'el-form': { template: '<form><slot /></form>' },
          'el-form-item': { template: '<div><slot /></div>' },
          'el-input': { template: '<input />' },
          'el-tabs': { template: '<div><slot /></div>' },
          'el-tab-pane': { template: '<div><slot /></div>' },
          'el-table': { template: '<div><slot /></div>' },
          'el-table-column': { template: '<div />' },
          'el-pagination': { template: '<div />' },
          'el-dialog': { template: '<div><slot /><slot name="footer" /></div>' },
          'el-button': { template: '<button><slot /></button>' },
          'el-select': { template: '<div><slot /></div>' },
          'el-option': { template: '<div />' },
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

    expect(wrapper.text()).toContain('平台授权')
    expect(wrapper.findAll('[data-testid="authorization-summary-card"]')).toHaveLength(0)

    wrapper.unmount()
    addEventListenerSpy.mockRestore()
    removeEventListenerSpy.mockRestore()
  })
})

