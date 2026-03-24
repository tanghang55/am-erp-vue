import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { defineComponent } from 'vue'
import { useLocaleStore } from '@/modules/common/stores/localeStore'
import ProductPickerDialog from '@/modules/procurement/components/ProductPickerDialog.vue'

const Stub = defineComponent({ template: '<div><slot /></div>' })
const DialogStub = defineComponent({
  props: ['title'],
  template: '<div><slot />{{ title }}</div>'
})
const ColumnStub = defineComponent({
  setup(_, { slots }) {
    return () => (slots.default ? slots.default({ row: {} }) : null)
  }
})

describe('ProductPickerDialog', () => {
  it('renders dialog title', async () => {
    setActivePinia(createPinia())
    const localeStore = useLocaleStore()
    localeStore.setLocale('zh-CN')

    const wrapper = shallowMount(ProductPickerDialog, {
      props: {
        modelValue: true
      },
      global: {
        stubs: {
          'el-dialog': DialogStub,
          'el-form': Stub,
          'el-form-item': Stub,
          'el-input': Stub,
          'el-select': Stub,
          'el-option': Stub,
          'el-button': Stub,
          'el-table': Stub,
          'el-table-column': ColumnStub,
          'el-pagination': Stub
        }
      }
    })

    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('选择产品')
  })
})
