import * as THREE from 'three'
import { createVbo } from './gl-utils'
import { noop } from './utils'

const jsonLoader = new THREE.JSONLoader()
const fontLoader = new THREE.FontLoader()

export function loadJSON (url) {
  return new Promise(resolve => {
    jsonLoader.load(url, resolve)
  })
}

export function loadFont (url, text) {
  return new Promise((resolve, reject) => {
    fontLoader.load(
      url,
      font => {
        const geometry = new THREE.TextGeometry(text, {
          font: font,
          size: 60 / (text.length / 4),
          height: 20,
          curveSegments: 12,
          bevelEnabled: true,
          bevelThickness: 1,
          bevelSize: 1,
          bevelSegments: 5
        })
        resolve(geometry)
      },
      noop,
      reject
    )
  })
}

export function getModelVbo (
  geometry,
  particleCount,
  scale = 1,
  offset = { x: 0, y: 0, z: 0 }
) {
  const facesCount = geometry.faces.length
  if (particleCount === void 0) {
    particleCount = facesCount
  }

  const storedNormals = {}
  for (let i = 0; i < facesCount; i++) {
    const face = geometry.faces[i]
    const { a, b, c, normal } = face
    ;[a, b, c].forEach(v => {
      const { x, y, z } = geometry.vertices[v]
      const key = `${x}${y}${z}`
      let storedNormal = storedNormals[key]
      if (storedNormal) {
        storedNormal += normal
      } else {
        storedNormals[key] = normal
      }
    })
  }

  const vertices = []
  const normals = []
  for (let i = 0; i < particleCount; i++) {
    const { a, b, c } = geometry.faces[i % facesCount]
    const random = Math.random()
    ;[a, b, c].forEach(v => {
      const { x, y, z } = geometry.vertices[v]
      vertices.push(
        x * scale + offset.x,
        y * scale + offset.y,
        z * scale + offset.z,
        random
      )
      const storedNormal = storedNormals[`${x}${y}${z}`]
      normals.push(storedNormal.x, storedNormal.y, storedNormal.z)
    })
  }

  return {
    vertices: createVbo(vertices),
    normal: createVbo(normals)
  }
}
