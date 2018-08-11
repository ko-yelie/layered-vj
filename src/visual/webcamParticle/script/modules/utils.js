export function getFirstValue (obj) {
  return Object.values(obj)[0]
}

export function shuffle (array) {
  for (let i = array.length - 1; i > 0; i--) {
    const r = Math.floor(Math.random() * (i + 1))
    const tmp = array[i]
    array[i] = array[r]
    array[r] = tmp
  }
}

export function clamp (n, min, max) {
  return Math.min(max, Math.max(min, n))
}
