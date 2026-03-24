import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useTabsStore } from '@/stores/tabsStore'

describe('tabsStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    localStorage.setItem('locale', 'zh-CN')
  })

  it('drops old parent product tabs and maps grouping routes to grouping titles', () => {
    localStorage.setItem(
      'erp-tabs',
      JSON.stringify([
        {
          path: '/product/parents',
          name: 'product-parents',
          title: '父体产品',
          closable: true
        },
        {
          path: '/product/parents/18',
          name: 'product-parents-detail',
          title: '父体详情',
          closable: true
        },
        {
          path: '/product/groups',
          name: 'product-groups',
          title: '旧标题',
          closable: true
        },
        {
          path: '/product/groups/18',
          name: 'product-groups-detail',
          title: '旧详情标题',
          closable: true
        }
      ])
    )
    localStorage.setItem('erp-active-tab', '/product/parents/18')

    const store = useTabsStore()
    store.init()

    expect(store.tabs.some((tab) => tab.path === '/product/parents')).toBe(false)
    expect(store.tabs.some((tab) => tab.path === '/product/parents/18')).toBe(false)
    expect(store.tabs.find((tab) => tab.path === '/product/groups')?.title).toBe('产品归组')
    expect(store.tabs.find((tab) => tab.path === '/product/groups/18')?.title).toBe('归组详情')
    expect(store.activeTab).toBe('/dashboard')
  })
})
