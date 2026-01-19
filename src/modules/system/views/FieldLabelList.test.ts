import { describe, it, expect, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { defineComponent } from 'vue'
import FieldLabelList from '@/modules/system/views/FieldLabelList.vue'
import { useLocaleStore } from '@/modules/common/stores/localeStore'

vi.mock('@/modules/system/api', () => ({
  getFieldLabelList: vi.fn().mockResolvedValue({
    success: true,
    data: { items: [], total: 0 }
  }),
  createFieldLabel: vi.fn(),
  updateFieldLabel: vi.fn(),
  deleteFieldLabel: vi.fn()
}))

const Stub = defineComponent({
  template: '<div><slot /></div>'
})

const NoSlotStub = defineComponent({
  template: '<div />'
})

const InputStub = defineComponent({
  props: ['placeholder'],
  template: '<input :placeholder="placeholder" />'
})

describe('FieldLabelList', () => {
  it('shows dot-path key placeholder', async () => {
    setActivePinia(createPinia())
    const localeStore = useLocaleStore()
    localeStore.setLocale('en-US')

    const wrapper = shallowMount(FieldLabelList, {
      global: {
        stubs: {
          'el-card': Stub,
          'el-form': Stub,
          'el-form-item': Stub,
          'el-table': NoSlotStub,
          'el-table-column': NoSlotStub,
          'el-pagination': Stub,
          'el-dialog': Stub,
          'el-button': Stub,
          'el-input': InputStub
        }
      }
    })

    await wrapper.vm.$nextTick()

    const placeholders = wrapper.findAll('input').map((input) => input.attributes('placeholder'))
    const matched = placeholders.some((value) => value?.includes('product.list.title'))
    expect(matched).toBe(true)
  })
})
