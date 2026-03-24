import { describe, it, expect, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { defineComponent } from 'vue'
import ProductGroupList from '@/modules/product/views/ProductGroupList.vue'
import { useLocaleStore } from '@/modules/common/stores/localeStore'

vi.mock('@/modules/product/api/groups', () => ({
  getProductGroupList: vi.fn().mockResolvedValue({ data: { data: [], total: 0 } }),
  createProductGroup: vi.fn(),
  updateProductGroup: vi.fn(),
  deleteProductGroup: vi.fn()
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: vi.fn()
  })
}))

const CardStub = defineComponent({
  template: '<div><slot name="header" /><slot /></div>'
})

const Stub = defineComponent({
  template: '<div><slot /></div>'
})

const NoSlotStub = defineComponent({
  template: '<div />'
})

describe('ProductGroupList', () => {
  it('renders grouping header and search toolbar', async () => {
    setActivePinia(createPinia())
    const localeStore = useLocaleStore()
    localeStore.setLocale('zh-CN')

    const wrapper = shallowMount(ProductGroupList, {
      global: {
        stubs: {
          'el-card': CardStub,
          'el-form': Stub,
          'el-form-item': Stub,
          'el-table': NoSlotStub,
          'el-table-column': NoSlotStub,
          'el-pagination': Stub,
          'el-dialog': Stub,
          'el-button': Stub,
          'el-icon': Stub,
          'el-input': Stub,
          'el-select': Stub,
          'el-option': Stub,
          'el-tag': Stub
        },
        directives: {
          loading: () => {}
        }
      }
    })

    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('产品归组')
    expect(wrapper.text()).toContain('归组档案')
    expect(wrapper.text()).toContain('查询')
    expect(wrapper.text()).toContain('重置')
  })
})
