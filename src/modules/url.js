export function getUrl (str) {
  if (/^\/[^/]/.test(str)) {
    return process.env.BASE_URL + str.slice(1)
  }
  return str
}
