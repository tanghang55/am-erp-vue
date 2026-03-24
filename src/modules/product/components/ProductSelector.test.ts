import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { defineComponent } from 'vue'
import ProductSelector from '@/modules/product/components/ProductSelector.vue'

const InputStub = defineComponent({
  props: ['modelValue', 'placeholder'],
  template: '<div>{{ placeholder }}</div>'
})

const ButtonStub = defineComponent({
  template: '<button><slot /></button>'
})

const ProductPickerDialogStub = defineComponent({
  props: ['productParams'],
  template: '<div class="picker-dialog-stub">{{ JSON.stringify(productParams || {}) }}</div>'
})

describe('ProductSelector', () => {
  it('passes productParams to picker dialog', async () => {
    setActivePinia(createPinia())

    const wrapper = shallowMount(ProductSelector, {
      props: {
        productParams: {
          marketplace: 'US',
          only_parentless: true
        }
      },
      global: {
        stubs: {
          'el-input': InputStub,
          'el-button': ButtonStub,
          ProductPickerDialog: ProductPickerDialogStub
        }
      }
    })

    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('"marketplace":"US"')
    expect(wrapper.text()).toContain('"only_parentless":true')
  })
})
