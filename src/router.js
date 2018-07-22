import Vue from 'vue'
import Router from 'vue-router'
import Index from './pages/index.vue'
import Control from './pages/control.vue'
// import routes from 'vue-auto-routing'
import { createRouterLayout } from 'vue-router-layout'

Vue.use(Router)

const RouterLayout = createRouterLayout(layout => {
  return import(`@/layouts/${layout}.vue`)
})

const router = new Router({
  mode: 'history',
  base: process.env.BASE_URL,
  routes: [
    {
      path: '/',
      component: RouterLayout,
      children: [
        {
          path: '/',
          name: 'index',
          component: Index,
          meta: {
            title: 'Layered VJ'
          }
        },
        {
          path: '/control',
          name: 'control',
          component: Control,
          meta: {
            title: 'Layered VJ - Control'
          }
        }
      ]
    }
  ]
})

router.beforeEach((to, from, next) => {
  if (to.meta && to.meta.title) {
    document.title = to.meta.title
  }
  next()
})

export default router
