const ua = navigator.userAgent

/**
 * iOS device
 * @see https://stackoverflow.com/questions/9038625/detect-if-device-is-ios
 * @type {boolean}
 */
export const isIos = /iPad|iPhone|iPod/.test(ua) && !window.MSStream

/**
 * Android device
 * @type {boolean}
 */
export const isAndroid = /Android/i.test(ua)

/**
 * mobile device
 * @type {boolean}
 */
export const isMobile = isIos || isAndroid
