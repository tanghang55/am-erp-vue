import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../modules/Home.vue')
  },
  {
    path: '/about',
    name: 'About',
    component: () => import('../modules/About.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
