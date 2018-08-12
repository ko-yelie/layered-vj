import * as THREE from 'three'
import { createVbo } from './gl-utils'

const loader = new THREE.JSONLoader()

export function loadJSON (url) {
  return new Promise(resolve => {
    loader.load(url, resolve)
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

  const vertices = []
  const normals = []
  for (let i = 0; i < particleCount; i++) {
    const cI = i % facesCount
    const { a, b, c, normal } = geometry.faces[cI]
    const random = Math.random()
    ;[a, b, c].forEach(v => {
      const { x, y, z } = geometry.vertices[v]
      vertices.push(
        x * scale + offset.x,
        y * scale + offset.y,
        z * scale + offset.z,
        random
      )
      normals.push(normal.x, normal.y, normal.z)
    })
  }

  return {
    vertices: createVbo(vertices),
    normal: createVbo(normals)
  }
}
