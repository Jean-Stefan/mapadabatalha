import type { PlaywrightRequestHandler, RequestProvider } from 'crawlee'
import { BrowserName, CriticalError, DeviceCategory, PlaywrightCrawler } from 'crawlee'
import { ERR_TOO_MANY_REDIRECTS } from '~/constants/errors'
import { useInstagramCookies } from './useInstagramCookies'

interface UseCrawlerParams {
  requestHandler: PlaywrightRequestHandler
  requestQueue?: RequestProvider
}

export function useCrawler({ requestHandler, requestQueue }: UseCrawlerParams) {
  const crawler = new PlaywrightCrawler({
    requestHandler,
    requestQueue,
    maxRequestRetries: 0,
    browserPoolOptions: {
      fingerprintOptions: {
        fingerprintGeneratorOptions: {
          browsers: [BrowserName.chrome, BrowserName.firefox],
          devices: [DeviceCategory.desktop],
          locales: ['pt-BR'],
        },
      },
    },
    async failedRequestHandler(_, error) {
      if (error.message.includes(ERR_TOO_MANY_REDIRECTS)) {
        throw new CriticalError(ERR_TOO_MANY_REDIRECTS)
      }
      throw new CriticalError(error.message)
    },
    preNavigationHooks: [
      async ({ blockRequests, page }) => {
        page.setDefaultTimeout(5000)
        const cookies = useInstagramCookies()
        await page.context().addCookies(cookies)
        await blockRequests({
          urlPatterns: [
            '.mp4',
            '.webp',
            '.png',
            '.woff2',
            'gtm.js',
            'www.googletagmanager.com',
            'pixel.admaxium.com',
          ],
        })
      },
    ],
    headless: true,
  })
  return crawler
}
