const mobile = typeof window !== 'undefined' &&
  (window.matchMedia('(max-width: 820px)').matches || /Android|iPhone|iPad/i.test(navigator.userAgent))
export const QUALITY = {
  mobile,
  dpr: mobile ? [1, 1.5] : [1, 2],
  leaves: mobile ? 260 : 720,
  texture: mobile ? 512 : 1024,
  post: !mobile && !new URLSearchParams(window.location.search).has('nofx'),
  debug: new URLSearchParams(window.location.search).has('debug'),
  maxLights: mobile ? 8 : 14,
}
