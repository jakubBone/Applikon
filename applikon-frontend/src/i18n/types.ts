import type plCommon from './locales/pl/common.json'
import type plErrors from './locales/pl/errors.json'
import type plBadges from './locales/pl/badges.json'
import type plTour from './locales/pl/tour.json'

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common'
    resources: {
      common: typeof plCommon
      errors: typeof plErrors
      badges: typeof plBadges
      tour: typeof plTour
    }
  }
}