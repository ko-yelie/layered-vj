<template lang="pug">
.vj-home
  .vj-title
    h1.md-display-4 Layered VJ
    p.md-display-1 v0.1.0
  router-link(to="/control")
    md-button.md-raised.md-primary Play
  p.vj-note: strong
    span.md-body-2 Note:
    br
    span.md-body-1 The pop-up for visual will automatically open on the control page.
      br
      | Please allow pop-ups for this site.
  ul.vj-links
    li.vj-links-item
      a(href="https://github.com/ko-yelie/layered-vj") GitHub
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

.vj-note {
  margin-top: 20px;
}

.vj-links {
  position: absolute;
  bottom: 0;
  right: 0;
  margin: 20px;
  padding-left: 0;

  &-item {
    list-style: none;
  }
}
</style>
