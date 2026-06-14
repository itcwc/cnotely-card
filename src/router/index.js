import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Desktop',
    component: () => import('../views/DesktopView.vue'),
  },
  {
    path: '/review',
    name: 'Review',
    component: () => import('../views/ReviewView.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
