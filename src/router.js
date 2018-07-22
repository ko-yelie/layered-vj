import Vue from 'vue'
import Router from 'vue-router'
import Home from './views/Home.vue'
import Control from './control/Control.vue'

Vue.use(Router)

export default new Router({
  mode: 'history',
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home
    },
    {
      path: '/control',
      name: 'control',
      component: Control
    }
  ]
})
