<template lang="pug">
.vj-home
  .vj-title
    h1.md-display-4 Layered VJ
    p.md-display-1 v0.1.0
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

.vj-home {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  position: relative;
  height: 100%;
  text-align: center;
}

.vj-title {
  margin-bottom: 48px;

  h1 {
    margin: 0;
  }

  p {
    margin: 10px 0 0;
  }
}
</style>
