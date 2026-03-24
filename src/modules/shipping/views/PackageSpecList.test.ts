import { describe, expect, it, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import PackageSpecList from '@/modules/shipping/views/PackageSpecList.vue'

vi.mock('@/modules/shipping/api', () => ({
  getPackageSpecList: vi.fn().mockResolvedValue({
    success: true,
    data: {
      data: [
        {
          id: 1,
          name: '标准箱',
          length: 50,
          width: 40,
          height: 30,
          weight: 2.5,
          quantity_per_box: 24,
          status: 'ACTIVE',
          gmt_modified: '2026-03-10 20:00:00',
          deletable: false,
          reference_count: 2,
          delete_block_reason: '已被发货明细引用，不可删除'
        }
      ],
      total: 1
    }
  }),
  createPackageSpec: vi.fn(),
  updatePackageSpec: vi.fn(),
  deletePackageSpec: vi.fn(),
  getPackageSpecPackagingItems: vi.fn().mockResolvedValue({ success: true, data: [] }),
  savePackageSpecPackagingItems: vi.fn()
}))

vi.mock('@/modules/packaging/api', () => ({
  getPackagingItemList: vi.fn().mockResolvedValue({
    success: true,
    data: {
      data: [],
      total: 0
    }
  })
}))

const CardStub = defineComponent({ template: '<div><slot name="header" /><slot /></div>' })
const Stub = defineComponent({ template: '<div><slot /></div>' })
const ColumnStub = defineComponent({
  setup(_, { slots }) {
    return () =>
      slots.default
        ? slots.default({
            row: {
              id: 1,
              name: '标准箱',
              length: 50,
              width: 40,
              height: 30,
              weight: 2.5,
              quantity_per_box: 24,
              status: 'ACTIVE',
              gmt_modified: '2026-03-10 20:00:00',
              deletable: false,
              reference_count: 2,
              delete_block_reason: '已被发货明细引用，不可删除'
            }
          })
        : null
  }
})
const TableStub = defineComponent({
  props: ['data'],
  template: '<div class="table" :data-count="(data || []).length"><slot /></div>'
})

const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0))

describe('PackageSpecList', () => {
  it('renders package spec without chinese header without summary cards', async () => {
    const wrapper = shallowMount(PackageSpecList, {
      global: {
        stubs: {
          'el-card': CardStub,
          'el-form': Stub,
          'el-form-item': Stub,
          'el-input': Stub,
          'el-select': Stub,
          'el-option': Stub,
          'el-button': Stub,
          'el-table': TableStub,
          'el-table-column': ColumnStub,
          'el-tag': Stub,
          'el-dialog': Stub,
          'el-pagination': Stub,
          'el-input-number': Stub,
          'el-empty': Stub,
          'el-divider': Stub,
          'el-icon': Stub,
          'el-dropdown': Stub,
          'el-dropdown-menu': Stub,
          'el-dropdown-item': Stub
        }
      }
    })

    await flushPromises()
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('装箱规格管理')
    expect(wrapper.text()).toContain('查看详情')
    expect(wrapper.text()).toContain('不可删除')
    expect(wrapper.text()).toContain('2 处引用')
    expect(wrapper.find('.table').attributes('data-count')).toBe('1')
    expect(wrapper.findAll('[data-testid="package-spec-summary-card"]')).toHaveLength(0)
  })
})

