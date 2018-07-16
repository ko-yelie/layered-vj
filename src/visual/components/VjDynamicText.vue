<template lang="pug">
</template>

<script>
import Two from 'two.js/build/two.js'

function mounted () {
  const colorList = [
    '#ff8e8e',
    '#ff8ec6',
    '#ff8eff',
    '#c68eff',
    '#8e8eff',
    '#8ec6ff',
    '#8effff',
    '#8effc6',
    '#8eff8e',
    '#c6ff8e',
    '#ffff8e',
    '#ffc68e',
    '#fff'
  ]
  const colorListLength = colorList.length

  /* eslint-disable */
  var two = new Two({
    type: Two.Types['canvas'],
    fullscreen: true,
    autostart: true
  }).appendTo(this.$el);

  var characters = [];
  var gravity = new Two.Vector(0, 0.66);

  var styles = {
    family: 'proxima-nova, sans-serif',
    size: 50,
    leading: 50,
    weight: 900
  };

  var directions = two.makeText('Start Typing', two.width / 2, two.height / 2, styles);
  directions.fill = 'white';

  window.addEventListener('keydown', function(e) {
    var character = String.fromCharCode(e.which);
    add(character);
  }, false);

  two
    .bind('resize', function() {
      directions.translation.set(two.width / 2, two.height / 2);
    })
    .bind('update', function() {

      for (var i = 0; i < characters.length; i++) {

        var text = characters[i];
        text.translation.addSelf(text.velocity);
        text.rotation += text.velocity.r;

        text.velocity.addSelf(gravity);
        if (text.velocity.y > 0 && text.translation.y > two.height)  {
          two.scene.remove(text);
          characters.splice(i, 1);
        }

      }

    });

  function add(msg) {

    var x = Math.random() * two.width / 2 + two.width / 4;
    var y = two.height * 1.25;

    var text = two.makeText(msg, x, y, styles);
    text.size *= 2;
    text.fill = colorList[Math.floor(Math.random() * colorListLength)];

    text.velocity = new Two.Vector();
    text.velocity.x = 10 * (Math.random() - 0.5);
    text.velocity.y = - (20 * Math.random() + 15);
    text.velocity.r = Math.random() * Math.PI / 8;

    characters.push(text);

  }
}

export default {
  mounted
}
</script>
