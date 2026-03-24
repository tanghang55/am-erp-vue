import { describe, expect, it, vi } from 'vitest'
import { defineComponent } from 'vue'
import { shallowMount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import ConfigCenter from '@/modules/system/views/ConfigCenter.vue'
import { useLocaleStore } from '@/modules/common/stores/localeStore'

vi.mock('@/modules/system/api', () => ({
  getConfigCenterModules: vi.fn().mockResolvedValue({
    success: true,
    data: [
      { module_code: 'finance', module_name: '财务配置', sort: 10 }
    ]
  }),
  getConfigCenterModule: vi.fn().mockResolvedValue({
    success: true,
    data: {
      module_code: 'finance',
      module_name: '财务配置',
      groups: [
        {
          group_code: 'base',
          group_name: '基础参数',
          items: [
            {
              config_key: 'finance.default_currency',
              label: '本位币',
              description: '系统初始化后锁定',
              value_type: 'ENUM',
              scope_type: 'GLOBAL',
              default_value: 'USD',
              value: 'USD',
              options: ['USD', 'CNY'],
              sort: 10
            }
          ]
        }
      ]
    }
  }),
  updateConfigCenterModule: vi.fn()
}))

vi.mock('vue-router', () => ({
  useRoute: () => ({ query: {} }),
  useRouter: () => ({ replace: vi.fn() })
}))

const CardStub = defineComponent({ template: '<div><slot name="header" /><slot /></div>' })
const Stub = defineComponent({ inheritAttrs: false, template: '<div><slot /></div>' })

describe('ConfigCenter', () => {
  it('renders chinese title and summary cards', async () => {
    setActivePinia(createPinia())
    const localeStore = useLocaleStore()
    localeStore.setLocale('zh-CN')

    const wrapper = shallowMount(ConfigCenter, {
      global: {
        stubs: {
          'el-card': CardStub,
          'el-menu': Stub,
          'el-menu-item': Stub,
          'el-form': Stub,
          'el-form-item': Stub,
          'el-input': Stub,
          'el-button': Stub,
          'el-select': Stub,
          'el-option': Stub,
          'el-empty': Stub,
          'el-input-number': Stub,
          'el-switch': Stub
        },
        directives: {
          loading: {}
        }
      }
    })

    await vi.dynamicImportSettled()
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('配置中心')
    expect(wrapper.findAll('[data-testid="config-center-summary-card"]')).toHaveLength(4)
    expect(wrapper.text()).toContain('财务配置')
  })
})
