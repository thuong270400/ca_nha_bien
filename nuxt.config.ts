// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  app: {
    head: {
      link: [
        { rel: 'icon', type: 'image/png', href: '/images/logo/logo.png' },
      ],
    },
  },

  modules: [
    '@nuxt/ui',
    '@pinia/nuxt',
    '@vueuse/nuxt',
    '@nuxt/image',
    'nuxt-auth-utils',
    '@nuxtjs/sitemap',
    '@nuxtjs/robots',
  ],

  css: ['~/assets/css/main.css'],

  typescript: {
    strict: true,
    typeCheck: false,
  },

  site: {
    url: process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000',
    name: 'Cá Nhà Biển - Cá tươi mỗi ngày',
  },

  sitemap: {
    sources: ['/api/__sitemap__/urls'],
  },

  nitro: {
    externals: {
      external: ['@prisma/client', '@prisma/adapter-pg', 'pg'],
    },
  },

  routeRules: {
    '/admin/**': { robots: false },
    '/account/**': { robots: false },
    '/cart': { robots: false },
    '/checkout': { robots: false },
    '/order/**': { robots: false },
    '/**': {
      headers: {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'SAMEORIGIN',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      },
    },
  },
})
