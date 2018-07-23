<template lang="pug">
.home
  h1.md-display-4 Layered VJ
  router-link(to="/control")
    md-button.md-raised.md-primary Go to Control
  p: strong.md-body-2 Note: The pop-up for visual will automatically open on the control page.
    br
    | Please allow pop-ups for this site.
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
  text-align: center;
}

h1 {
  margin: 0 0 48px;
}
</style>
