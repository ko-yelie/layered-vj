<template lang="pug">
.home
  h1 Layered VJ
  router-link(to="/control")
    md-button.md-raised.md-primary Go to Control
  p: strong Note: The new tab will automatically open on the control page.
</template>

<style lang="scss">
body {
  height: 100%;
}

.home {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  position: relative;
  height: 100%;
}

h1 {
  margin: 0 0 0.8em;
  font-size: 3rem;
  line-height: 1;
}
</style>
