export function getFirstValue (obj) {
  return Object.values(obj)[0]
}

export function clamp (n, min, max) {
  return Math.min(max, Math.max(min, n))
}
