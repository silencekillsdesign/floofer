export default defineNuxtConfig({
  modules: ["@nuxtjs/tailwindcss", "@vueuse/nuxt", "@nuxt/image", "@vite-pwa/nuxt"],

  /* Remote pet photos get resized/WebP'd. On Netlify we hand off to their
     Image CDN — otherwise the build bundles a platform-specific sharp binary
     that won't match the Linux deploy target. */
  image: {
    provider: process.env.NETLIFY ? "netlify" : "ipx",
    domains: [
      "images.dog.ceo",
      "dl5zpyw5k3jeb.cloudfront.net", // Petfinder
      "photos.petfinder.com",
      "cdn.rescuegroups.org",
      "s3.amazonaws.com",
    ],
    screens: { xs: 320, sm: 420, md: 640, lg: 900 },
  },

  /* Installable to the home screen: real icon, standalone chrome, and dog
     photos cached so a spotty connection doesn't blank the deck. */
  pwa: {
    registerType: "autoUpdate",
    manifest: {
      name: "Floofer — Swipe. Match. Save a life.",
      short_name: "Floofer",
      description:
        "Swipe to adopt. Floofer surfaces dogs at the highest risk of euthanization first.",
      lang: "en",
      theme_color: "#000000",
      background_color: "#000000",
      display: "standalone",
      orientation: "portrait",
      start_url: "/",
      icons: [
        { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
        { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
        {
          src: "/icons/icon-maskable-512.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "maskable",
        },
      ],
    },
    workbox: {
      navigateFallback: "/",
      globPatterns: ["**/*.{js,css,html,svg,png,ico,woff2}"],
      runtimeCaching: [
        {
          urlPattern: /^https:\/\/images\.dog\.ceo\/.*/i,
          handler: "CacheFirst",
          options: {
            cacheName: "floofer-dog-photos",
            expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
            cacheableResponse: { statuses: [0, 200] },
          },
        },
        {
          urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
          handler: "CacheFirst",
          options: {
            cacheName: "floofer-fonts",
            expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
            cacheableResponse: { statuses: [0, 200] },
          },
        },
      ],
    },
    // a service worker in dev fights HMR
    devOptions: { enabled: false },
  },

  runtimeConfig: {
    // set via NUXT_* vars in .env — never exposed to the client
    rescuegroupsApiKey: "",
    petfinderApiKey: "",
    petfinderSecret: "",
  },
  css: ["leaflet/dist/leaflet.css", "~/assets/css/main.css"],
  ssr: false,
  app: {
    head: {
      title: "floofer — Swipe. Match. Save a life.",
      meta: [
        { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
        {
          name: "description",
          content:
            "Tinder for pet adoption. Rescue Match connects adopters with dogs at the highest risk of euthanization from shelters, fosters, homes, and retirement communities.",
        },
      ],
      link: [
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        { rel: "preconnect", href: "https://fonts.gstatic.com", crossorigin: "" },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Inter:wght@400;500;600;700;800&display=swap",
        },
        {
          rel: "icon",
          href: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🐾</text></svg>",
        },
      ],
    },
  },
  compatibilityDate: "2026-07-18",
});
