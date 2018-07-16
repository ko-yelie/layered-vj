<template>
  <!-- <div>
    <nav>
      <router-link to="/">Home</router-link> |
      <router-link to="/control">Control</router-link>
    </nav>
    <router-view></router-view>
  </div> -->
  <router-view></router-view>
</template>

<style lang="scss">
@import "./assets/css/vue-material.css";

nav {
  position: fixed;
  padding: 30px;
  a {
    font-weight: bold;
    color: #2c3e50;
    &.router-link-exact-active {
      color: #42b983;
    }
  }
}
</style>
