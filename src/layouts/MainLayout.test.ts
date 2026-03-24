import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory, type RouteRecordRaw } from 'vue-router'
import { defineComponent, ref, nextTick } from 'vue'
import MainLayout from '@/layouts/MainLayout.vue'

vi.mock('@/modules/identity/stores/authStore', () => ({
  useAuthStore: () => ({
    user: { username: 'admin', real_name: '管理员' },
    roles: [{ display_name: '管理员' }],
    logout: vi.fn().mockResolvedValue(undefined)
  })
}))

vi.mock('@/modules/identity/stores/menuStore', () => ({
  useMenuStore: () => ({
    menus: [
      { id: 1, title: '页面A', path: '/page-a', children: [] },
      { id: 2, title: '页面B', path: '/page-b', children: [] }
    ],
    loading: false,
    loadMenus: vi.fn().mockResolvedValue(undefined),
    clearMenus: vi.fn()
  })
}))

vi.mock('@/modules/common/stores/localeStore', () => ({
  useLocaleStore: () => ({
    locale: 'zh-CN',
    isEnglish: false,
    setLocale: vi.fn()
  })
}))

const tabsStoreMock = {
  tabs: [{ path: '/dashboard', name: 'dashboard', title: '仪表板', closable: false }],
  activeTab: '/dashboard',
  clearTabs: vi.fn(),
  init: vi.fn(),
  addTab: vi.fn(),
  setActiveTab: vi.fn()
}

vi.mock('@/stores/tabsStore', () => ({
  useTabsStore: () => tabsStoreMock
}))

vi.mock('@/components/TabsView.vue', () => ({
  default: defineComponent({
    name: 'TabsView',
    template: '<div class="tabs-view-stub" />'
  })
}))

const PageA = defineComponent({
  name: 'PageAView',
  setup() {
    const count = ref(0)
    return { count }
  },
  template: '<button class="page-a-inc" @click="count++">A {{ count }}</button>'
})

const PageB = defineComponent({
  name: 'PageBView',
  template: '<div class="page-b">page b</div>'
})

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: MainLayout,
    children: [
      { path: 'page-a', name: 'page-a', component: PageA },
      { path: 'page-b', name: 'page-b', component: PageB }
    ]
  }
]

describe('MainLayout keep-alive', () => {
  beforeEach(() => {
    localStorage.clear()
    localStorage.setItem('locale', 'zh-CN')
    tabsStoreMock.clearTabs.mockClear()
    tabsStoreMock.init.mockClear()
    tabsStoreMock.addTab.mockClear()
    tabsStoreMock.setActiveTab.mockClear()
  })

  it('preserves page state when switching menus', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes
    })

    router.push('/page-a')
    await router.isReady()

    const wrapper = mount(MainLayout, {
      global: {
        plugins: [router],
        stubs: {
          'el-container': { template: '<div><slot /></div>' },
          'el-header': { template: '<div><slot /></div>' },
          'el-main': { template: '<main><slot /></main>' },
          'el-menu': { template: '<div><slot /></div>' },
          'el-menu-item': { template: '<div><slot /></div>' },
          'el-sub-menu': { template: '<div><slot name="title" /><slot /></div>' },
          'el-icon': { template: '<i><slot /></i>' },
          'el-select': { template: '<div><slot /></div>' },
          'el-option': { template: '<div />' },
          'el-dropdown': { template: '<div><slot /><slot name="dropdown" /></div>' },
          'el-dropdown-menu': { template: '<div><slot /></div>' },
          'el-dropdown-item': { template: '<div><slot /></div>' }
        }
      }
    })

    await flushPromises()

    await wrapper.get('.page-a-inc').trigger('click')
    expect(wrapper.text()).toContain('A 1')

    await router.push('/page-b')
    await flushPromises()
    expect(wrapper.find('.page-b').exists()).toBe(true)

    await router.push('/page-a')
    await flushPromises()
    await nextTick()

    expect(wrapper.text()).toContain('A 1')
  })
})
