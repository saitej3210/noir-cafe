// Self-hosted font for all 3D text: drei <Text> otherwise downloads fallback-font data from a CDN at runtime,
// and the whole 3D scene fails if that request is blocked (offline, firewalls, some mobile networks).
import FONT from '@fontsource/cormorant-garamond/files/cormorant-garamond-latin-500-normal.woff?url'
export { FONT }
