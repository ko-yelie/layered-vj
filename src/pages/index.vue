<template lang="pug">
.vj-home
  .vj-title
    h1.md-display-4 Layered VJ
    p.md-display-1 v0.1.0
    p.md-subheading VJ app on browser.
      br
      | Drag and drop to switch visuals.
  div(v-if="isMobile")
    p.vj-note
      strong.md-body-2 Not support mobile device.
        br
        | Please browse with PC.
  div(v-else)
    router-link(to="/control")
      md-button.md-raised.md-primary Play
    p.vj-browser.md-caption Recommended browser: Google Chrome
    p.vj-note
      strong.md-body-2 Note:
        br
        | The pop-up for visual will automatically open on the control page.
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

h1 {
  margin: 0;
}

p {
  margin: 0;
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

  .md-subheading {
    margin-top: 10px;
  }
}

.vj-browser {
  margin-top: 5px;
}

.vj-note {
  margin-top: 10px;
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
