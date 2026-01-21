import { describe, it, expect, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { defineComponent } from 'vue'
import PurchaseOrderEdit from '@/modules/procurement/views/PurchaseOrderEdit.vue'
import { useLocaleStore } from '@/modules/common/stores/localeStore'

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn()
  }),
  useRoute: () => ({
    params: { id: '12' }
  })
}))

const CardStub = defineComponent({ template: '<div><slot name="header" /><slot /></div>' })
const Stub = defineComponent({ template: '<div><slot /></div>' })
const PageHeaderStub = defineComponent({
  props: ['content'],
  template: '<div>{{ content }}</div>'
})

describe('PurchaseOrderEdit', () => {
  it('renders edit title', async () => {
    setActivePinia(createPinia())
    const localeStore = useLocaleStore()
    localeStore.setLocale('zh-CN')

    const wrapper = shallowMount(PurchaseOrderEdit, {
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

    expect(wrapper.text()).toContain('编辑采购单')
  })
})
