import { describe, it, expect } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useFieldLabelStore } from '@/modules/common/stores/fieldLabelStore'

describe('fieldLabelStore', () => {
  it('returns label for lowercase key', () => {
    setActivePinia(createPinia())
    const store = useFieldLabelStore()
    store.labels = { 'product.list.title': '产品列表' }
    expect(store.getLabel('product.list.title')).toBe('产品列表')
  })
})
