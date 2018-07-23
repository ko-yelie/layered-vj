import { pick } from 'lodash'
import dat from 'dat.gui'

import ipc from '../../modules/ipc'
import defaultConfig from '../../assets/json/js/particlesjs-config.json'
import topConfig from '../../assets/json/js/particlesjs-config-top.json'

const configs = {
  default: defaultConfig,
  top: topConfig
}

/* eslint-disable */
export default function(config) {
  var configJson = configs[config] || {};

  ipc.send('dispatch-particles-js', 'initParticlesJs', configJson)

  ipc.once('receive-particles-js', (event, pJS) => {
    var f, ff, fm, fmm, gui_f, initPage, resizeGUI;
    var p = {};

    var pJS_GUI = pick(pJS, [
      'particles',
      'interactivity',
      'retina_detect',
      'tmp'
    ])

    var gui = new dat.GUI({
      autoPlace: true,
      closed: true,
      width: 340
    });

    p.update = function() {
      ipc.send('dispatch-particles-js', 'updateParticlesJs', pJS_GUI)
    };

    gui_f = {
      particles: gui.addFolder('particles'),
      interactivity: gui.addFolder('interactivity')
    };
    f = {
      particles: {
        number: gui_f.particles.addFolder('number'),
        color: gui_f.particles.addFolder('color'),
        shape: gui_f.particles.addFolder('shape'),
        size: gui_f.particles.addFolder('size'),
        opacity: gui_f.particles.addFolder('opacity'),
        line_linked: gui_f.particles.addFolder('line_linked'),
        move: gui_f.particles.addFolder('move')
      },
      interactivity: {
        events_onhover: gui_f.interactivity.addFolder('onhover'),
        events_onclick: gui_f.interactivity.addFolder('onclick'),
        modes: gui_f.interactivity.addFolder('modes')
      }
    };
    ff = {
      shape_stroke: f.particles.shape.addFolder('stroke'),
      shape_polygon: f.particles.shape.addFolder('polygon'),
      shape_image: f.particles.shape.addFolder('image'),
      size_anim: f.particles.size.addFolder('anim'),
      opacity_anim: f.particles.opacity.addFolder('anim')
    };
    fm = {
      grab: f.interactivity.modes.addFolder('grab'),
      bubble: f.interactivity.modes.addFolder('bubble'),
      repulse: f.interactivity.modes.addFolder('repulse'),
      push: f.interactivity.modes.addFolder('push'),
      remove: f.interactivity.modes.addFolder('remove')
    };
    fmm = {
      grab_linelinked: fm.grab.addFolder('line_linked')
    };

    gui.add(pJS_GUI, 'retina_detect').name('retina_detect').onChange(function(value) {
      pJS_GUI.retina_detect = value;
      return p.update();
    });
    f.particles.number.add(pJS_GUI.particles.number, 'value', 0, 600).name('value').step(1).onChange(function(value) {
      pJS_GUI.particles.number.value = value;
      return p.update();
    });
    f.particles.number.add(pJS_GUI.particles.number.density, 'enable').name('density.enable').onChange(function(value) {
      pJS_GUI.particles.number.density.enable = value;
      return p.update();
    });
    f.particles.number.add(pJS_GUI.particles.number.density, 'value_area', 0, 10000).name('density.value_area').onChange(function(value) {
      pJS_GUI.particles.number.density.value_area = value;
      return p.update();
    });
    f.particles.color.addColor(pJS_GUI.particles.color, 'value').name('value (single string)').onChange(function(value) {
      pJS_GUI.particles.color.value = value;
      return p.update();
    });
    f.particles.shape.add(pJS_GUI.particles.shape, 'type', ['circle', 'edge', 'triangle', 'polygon', 'star', 'image']).name('type').onChange(function(value) {
      pJS_GUI.particles.shape.type = value;
      return p.update();
    });
    ff.shape_polygon.add(pJS_GUI.particles.shape.polygon, 'nb_sides', 3, 12).step(1).name('polygon.nb_sides').onChange(function(value) {
      pJS_GUI.particles.shape.polygon.nb_sides = value;
      return p.update();
    });
    ff.shape_stroke.add(pJS_GUI.particles.shape.stroke, 'width', 0, 20).step(1).name('stroke.width').onChange(function(value) {
      pJS_GUI.particles.shape.stroke.width = value;
      return p.update();
    });
    ff.shape_stroke.addColor(pJS_GUI.particles.shape.stroke, 'color').name('stroke.color').onChange(function(value) {
      pJS_GUI.particles.shape.stroke.color = value;
      return p.update();
    });
    ff.shape_image.add(pJS_GUI.particles.shape.image, 'src').name('image.src').onChange(function(value) {
      var type;
      pJS_GUI.particles.shape.image.src = value;
      if (pJS_GUI.particles.shape.type === 'image') {
        type = value.substr(value.length - 3);
        if (type === 'svg' && value !== 'svg/github.svg') {
          alert("Ajax request is necessary for loading SVG files. You can type this example into the 'image.src' input to solve the CORS issue: 'svg/github.svg'");
        }
      }
      return p.update();
    });
    ff.shape_image.add(pJS_GUI.particles.shape.image, 'width').name('image.width').onChange(function(value) {
      pJS_GUI.particles.shape.image.width = value;
      return p.update();
    });
    ff.shape_image.add(pJS_GUI.particles.shape.image, 'height').name('image.height').onChange(function(value) {
      pJS_GUI.particles.shape.image.height = value;
      return p.update();
    });
    f.particles.size.add(pJS_GUI.tmp.obj, 'size_value', 0, 500).name('value').onChange(function(value) {
      pJS_GUI.tmp.obj.size_value = value;
      return p.update();
    });
    f.particles.size.add(pJS_GUI.particles.size, 'random').name('random').onChange(function(value) {
      pJS_GUI.particles.size.random = value;
      return p.update();
    });
    ff.size_anim.add(pJS_GUI.particles.size.anim, 'enable').name('anim.enable').onChange(function(value) {
      pJS_GUI.particles.size.anim.enable = value;
      return p.update();
    });
    ff.size_anim.add(pJS_GUI.tmp.obj, 'size_anim_speed', 0, 300).name('anim.speed').onChange(function(value) {
      pJS_GUI.tmp.obj.size_anim_speed = value;
      return p.update();
    });
    ff.size_anim.add(pJS_GUI.particles.size.anim, 'size_min', 0, 100).name('anim.size_min').onChange(function(value) {
      pJS_GUI.particles.size.anim.size_min = value;
      return p.update();
    });
    ff.size_anim.add(pJS_GUI.particles.size.anim, 'sync').name('anim.sync').onChange(function(value) {
      pJS_GUI.particles.size.anim.sync = value;
      return p.update();
    });
    f.particles.opacity.add(pJS_GUI.particles.opacity, 'value', 0, 1).name('value').onChange(function(value) {
      pJS_GUI.particles.opacity.value = value;
      return p.update();
    });
    f.particles.opacity.add(pJS_GUI.particles.opacity, 'random').name('random').onChange(function(value) {
      pJS_GUI.particles.opacity.random = value;
      return p.update();
    });
    ff.opacity_anim.add(pJS_GUI.particles.opacity.anim, 'enable').name('anim.enable').onChange(function(value) {
      pJS_GUI.particles.opacity.anim.enable = value;
      return p.update();
    });
    ff.opacity_anim.add(pJS_GUI.particles.opacity.anim, 'speed', 0, 10).name('anim.speed').onChange(function(value) {
      pJS_GUI.particles.opacity.anim.speed = value;
      return p.update();
    });
    ff.opacity_anim.add(pJS_GUI.particles.opacity.anim, 'opacity_min', 0, 1).name('anim.opacity_min').onChange(function(value) {
      pJS_GUI.particles.opacity.anim.opacity_min = value;
      return p.update();
    });
    ff.opacity_anim.add(pJS_GUI.particles.opacity.anim, 'sync').name('anim.sync').onChange(function(value) {
      pJS_GUI.particles.opacity.anim.sync = value;
      return p.update();
    });
    f.particles.line_linked.add(pJS_GUI.particles.line_linked, 'enable').name('enable_auto').onChange(function(value) {
      pJS_GUI.particles.line_linked.enable = value;
      return p.update();
    });
    f.particles.line_linked.add(pJS_GUI.tmp.obj, 'line_linked_distance', 0, 2000).name('distance').onChange(function(value) {
      pJS_GUI.tmp.obj.line_linked_distance = value;
      return p.update();
    });
    f.particles.line_linked.addColor(pJS_GUI.particles.line_linked, 'color').name('color').onChange(function(value) {
      pJS_GUI.particles.line_linked.color = value;
      return p.update();
    });
    f.particles.line_linked.add(pJS_GUI.particles.line_linked, 'opacity', 0, 1).name('opacity').onChange(function(value) {
      pJS_GUI.particles.line_linked.opacity = value;
      return p.update();
    });
    f.particles.line_linked.add(pJS_GUI.tmp.obj, 'line_linked_width', 0, 20).name('width').onChange(function(value) {
      pJS_GUI.tmp.obj.line_linked_width = value;
      return p.update();
    });
    f.particles.move.add(pJS_GUI.particles.move, 'enable').name('enable').onChange(function(value) {
      pJS_GUI.particles.move.enable = value;
      return p.update();
    });
    f.particles.move.add(pJS_GUI.particles.move, 'direction', ['none', 'top', 'top-right', 'right', 'bottom-right', 'bottom', 'bottom-left', 'left', 'top-left']).name('direction').onChange(function(value) {
      pJS_GUI.particles.move.direction = value;
      return p.update();
    });
    f.particles.move.add(pJS_GUI.particles.move, 'random').name('random').onChange(function(value) {
      pJS_GUI.particles.move.random = value;
      return p.update();
    });
    f.particles.move.add(pJS_GUI.particles.move, 'straight').name('straight').onChange(function(value) {
      pJS_GUI.particles.move.straight = value;
      return p.update();
    });
    f.particles.move.add(pJS_GUI.tmp.obj, 'move_speed', 0, 200).name('speed').onChange(function(value) {
      pJS_GUI.tmp.obj.move_speed = value;
      return p.update();
    });
    f.particles.move.add(pJS_GUI.particles.move, 'out_mode', ['out', 'bounce']).name('out_mode').onChange(function(value) {
      pJS_GUI.particles.move.out_mode = value;
      return p.update();
    });
    f.particles.move.add(pJS_GUI.particles.move.attract, 'enable').name('attract.enable').onChange(function(value) {
      pJS_GUI.particles.move.attract.enable = value;
      return p.update();
    });
    f.particles.move.add(pJS_GUI.particles.move.attract, 'rotateX', 0, 10000).name('attract.rotateX').onChange(function(value) {
      pJS_GUI.particles.move.attract.rotateX = value;
      return p.update();
    });
    f.particles.move.add(pJS_GUI.particles.move.attract, 'rotateY', 0, 10000).name('attract.rotateY').onChange(function(value) {
      pJS_GUI.particles.move.attract.rotateY = value;
      return p.update();
    });
    gui_f.interactivity.add(pJS_GUI.interactivity, 'detect_on', ['window', 'canvas']).name('detect_on').onChange(function(value) {
      pJS_GUI.interactivity.detect_on = value;
      return p.update();
    });
    f.interactivity.events_onhover.add(pJS_GUI.interactivity.events.onhover, 'enable').name('enable').onChange(function(value) {
      pJS_GUI.interactivity.events.onhover.enable = value;
      return p.update();
    });
    f.interactivity.events_onhover.add(pJS_GUI.interactivity.events.onhover, 'mode', ['grab', 'bubble', 'repulse']).name('mode').onChange(function(value) {
      pJS_GUI.interactivity.events.onhover.mode = value;
      return p.update();
    });
    f.interactivity.events_onclick.add(pJS_GUI.interactivity.events.onclick, 'enable').name('enable').onChange(function(value) {
      pJS_GUI.interactivity.events.onclick.enable = value;
      return p.update();
    });
    f.interactivity.events_onclick.add(pJS_GUI.interactivity.events.onclick, 'mode', ['push', 'remove', 'bubble', 'repulse']).name('mode').onChange(function(value) {
      pJS_GUI.interactivity.events.onclick.mode = value;
      return p.update();
    });
    fm.grab.add(pJS_GUI.tmp.obj, 'mode_grab_distance', 0, 1500).name('distance').onChange(function(value) {
      pJS_GUI.tmp.obj.mode_grab_distance = value;
      return p.update();
    });
    fmm.grab_linelinked.add(pJS_GUI.interactivity.modes.grab.line_linked, 'opacity', 0, 1).name('opacity').onChange(function(value) {
      pJS_GUI.interactivity.modes.grab.line_linked.opacity = value;
      return p.update();
    });
    fm.bubble.add(pJS_GUI.tmp.obj, 'mode_bubble_distance', 0, 1500).name('distance').onChange(function(value) {
      pJS_GUI.tmp.obj.mode_bubble_distance = value;
      return p.update();
    });
    fm.bubble.add(pJS_GUI.tmp.obj, 'mode_bubble_size', 0, 500).name('size').onChange(function(value) {
      pJS_GUI.tmp.obj.mode_bubble_size = value;
      return p.update();
    });
    fm.bubble.add(pJS_GUI.interactivity.modes.bubble, 'opacity', 0, 1).name('opacity').onChange(function(value) {
      pJS_GUI.interactivity.modes.bubble.opacity = value;
      return p.update();
    });
    fm.bubble.add(pJS_GUI.interactivity.modes.bubble, 'duration', 0, 10).name('duration (sec)').onChange(function(value) {
      pJS_GUI.interactivity.modes.bubble.duration = value;
      return p.update();
    });
    fm.repulse.add(pJS_GUI.tmp.obj, 'mode_repulse_distance', 0, 1000).name('distance').onChange(function(value) {
      pJS_GUI.tmp.obj.mode_repulse_distance = value;
      return p.update();
    });
  })
};
