import { describe, it, expect, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { defineComponent } from 'vue'
import PurchaseOrderCreate from '@/modules/procurement/views/PurchaseOrderCreate.vue'
import { useLocaleStore } from '@/modules/common/stores/localeStore'

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn()
  })
}))

const CardStub = defineComponent({ template: '<div><slot name="header" /><slot /></div>' })
const Stub = defineComponent({ template: '<div><slot /></div>' })
const PageHeaderStub = defineComponent({
  props: ['content'],
  template: '<div>{{ content }}</div>'
})

describe('PurchaseOrderCreate', () => {
  it('renders create title', async () => {
    setActivePinia(createPinia())
    const localeStore = useLocaleStore()
    localeStore.setLocale('zh-CN')

    const wrapper = shallowMount(PurchaseOrderCreate, {
      global: {
        stubs: {
          'el-card': CardStub,
          'el-button': Stub,
          'el-page-header': PageHeaderStub,
          PurchaseOrderForm: Stub
        }
      }
    })

    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('新建采购单')
  })
})
