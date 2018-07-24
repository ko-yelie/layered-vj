import Vue from 'vue'
import VueMaterial from 'vue-material'

import App from './App.vue'
import router from './router'
import store from './control/store'
import { isMobile } from './modules/navigator'

Vue.config.productionTip = false

Vue.mixin({
  data () {
    return {
      isMobile: isMobile
    }
  }
})

Vue.use(VueMaterial)

Vue.material.registerTheme('default', {
  accent: 'teal'
})

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
