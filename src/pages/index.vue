<template lang="pug">
.home
  h1.md-display-4 Layered VJ
  router-link(to="/control")
    md-button.md-raised.md-primary Go to Control
  p: strong.md-body-2 Note: The new tab will automatically open on the control page.
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
  margin: 0 0 48px;
}
</style>
