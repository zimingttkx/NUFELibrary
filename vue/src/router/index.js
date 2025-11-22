import Vue from 'vue'
import VueRouter from 'vue-router'

Vue.use(VueRouter)

// 路由配置
const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/Home.vue'),
    meta: { title: '首页' }
  },
  {
    path: '/reservation',
    name: 'Reservation',
    component: () => import('../views/ReservationManage.vue'),
    meta: { title: '预约管理' }
  },
  {
    path: '/seat-view',
    name: 'SeatView',
    component: () => import('../views/SeatView.vue'),
    meta: { title: '座位查看' }
  },
  {
    path: '/favorite-monitor',
    name: 'FavoriteMonitor',
    component: () => import('../views/FavoriteMonitor.vue'),
    meta: { title: '收藏监控' }
  },
  {
    path: '/floor-occupancy',
    name: 'FloorOccupancy',
    component: () => import('../views/FloorOccupancy.vue'),
    meta: { title: '楼层占用情况' }
  }
]

const router = new VueRouter({
  mode: 'hash',
  routes
})

// 路由守卫 - 设置页面标题
router.beforeEach((to, from, next) => {
  if (to.meta.title) {
    document.title = to.meta.title + ' - 梓铭祝你天天开心'
  }
  next()
})

export default router
