/**
 * dsh-skin — host half.
 *
 * The host side is intentionally a no-op loader entry: the whole feature
 * lives in the browser half (`./client`), which DSH's dsh-client-modules
 * picks up through the package's `dsh.client` declaration — the same shape
 * as the shipped ui-* packages. The skin choice is persisted in
 * localStorage, because the Host settings wire only exposes an allowlisted
 * set of namespaces to browser clients (dsh-host-apiproxy's
 * WEB_SETTINGS_NAMESPACES), so a third-party namespace would answer
 * `settings-not-exposed`; the product itself keeps remote browser
 * preferences process-local.
 */

import { readFile } from 'node:fs/promises'

/** Local-only wallpaper endpoints used by the browser themes. */
const WHALE_WALLPAPERS = new Map([
  ['/plugins/dsh-skin/whale-maiden-v1.png', new URL('../assets/whale-maiden-v1.png', import.meta.url)],
  ['/plugins/dsh-skin/whale-cyber-v1.png', new URL('../assets/whale-cyber-v1.png', import.meta.url)],
  ['/plugins/dsh-skin/whale-gala-v1.png', new URL('../assets/whale-gala-v1.png', import.meta.url)],
  ['/plugins/dsh-skin/whale-sport-v1.png', new URL('../assets/whale-sport-v1.png', import.meta.url)],
  ['/plugins/dsh-skin/whale-witch-v1.png', new URL('../assets/whale-witch-v1.png', import.meta.url)],
  ['/plugins/dsh-skin/whale-deepseek-maid-v2.png', new URL('../assets/whale-deepseek-maid-v2.png', import.meta.url)],
  ['/plugins/dsh-skin/whale-deepseek-cozy-v2.png', new URL('../assets/whale-deepseek-cozy-v2.png', import.meta.url)],
  ['/plugins/dsh-skin/whale-deepseek-qipao-v2.png', new URL('../assets/whale-deepseek-qipao-v2.png', import.meta.url)],
  ['/plugins/dsh-skin/whale-deepseek-idol-v2.png', new URL('../assets/whale-deepseek-idol-v2.png', import.meta.url)],
])

export const inject = ['webServer']

/** Host loader entry for the browser implementation exported from `./client`. */
export function apply(ctx) {
  ctx.effect(() => {
    const disposers = [...WHALE_WALLPAPERS].map(([path, file]) => ctx.webServer.register({
      kind: 'exact',
      path,
      async handler(req, res) {
        if (req.method !== 'GET' && req.method !== 'HEAD') {
          res.statusCode = 405
          res.setHeader('Allow', 'GET, HEAD')
          res.end()
          return
        }
        let image
        try { image = await readFile(file) } catch (error) {
          if (error?.code !== 'ENOENT') throw error
          res.statusCode = 404
          res.end()
          return
        }
        res.statusCode = 200
        res.setHeader('Content-Type', 'image/png')
        res.setHeader('Cache-Control', 'public, max-age=86400')
        res.setHeader('Content-Length', String(image.byteLength))
        res.end(req.method === 'HEAD' ? undefined : image)
      },
    }))
    return () => { for (const dispose of disposers) dispose() }
  }, 'dsh-skin: whale maiden wallpapers')
}
