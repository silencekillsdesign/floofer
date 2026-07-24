export default defineNuxtConfig({
  modules: [
    "@nuxtjs/tailwindcss",
    "@vueuse/nuxt",
    "@nuxt/image",
    "@vite-pwa/nuxt",
    "nuxt-og-image",
    "@sentry/nuxt/module",
    "@nuxtjs/supabase",
  ],

  /* Anonymous browsing is the product: an at-risk dog's page has to be
     shareable and indexable without a login wall. `redirect: false` disables
     the module's default global auth guard — individual org-only routes opt
     in via middleware instead. */
  supabase: {
    /* The module's runtime plugin THROWS (not warns) when these are absent,
       which would take the whole app down before the Supabase project even
       exists. Fall back to the CLI's local default so the client constructs
       harmlessly and demo mode keeps working; `useDb().configured` is the
       gate that stops anything actually calling it. localhost is deliberate —
       a placeholder public host could resolve to someone else's server. */
    url: process.env.NUXT_PUBLIC_SUPABASE_URL || "http://localhost:54321",
    key: process.env.NUXT_PUBLIC_SUPABASE_KEY || "local-anon-key-placeholder",
    redirect: false,
    /* We hand-maintain row types in types/db.ts rather than generating a
       `Database` type, so stop the module looking for one. */
    types: false,
    /* Supabase writes its session to a cookie so SSR sees the same auth state
       the client does; without this the server renders logged-out and the
       page flips after hydration. */
    cookieOptions: { sameSite: "lax", secure: process.env.NODE_ENV === "production" },
  },

  /* Shared links need real Open Graph tags, and indexed pet pages mean organic
     traffic for at-risk dogs — both require server rendering. Personalized,
     localStorage-driven UI is wrapped in <ClientOnly> so hydration stays clean. */
  ssr: true,
  site: {
    url: process.env.NUXT_PUBLIC_SITE_URL || "https://floofer.netlify.app",
    name: "Floofer",
  },
  /* satori is pure JS — the takumi default pulls a native Rust binary that
     would have to match the deploy architecture. */
  ogImage: { defaults: { renderer: "satori" } },

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
    public: {
      // optional: enables error reporting when set
      sentryDsn: "",
    },
  },
  css: ["leaflet/dist/leaflet.css", "~/assets/css/main.css"],
  app: {
    head: {
      title: "floofer — Swipe. Match. Save a life.",
      meta: [
        { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
        {
          name: "description",
          content:
            "Tinder for pet adoption. Floofer connects adopters with dogs at the highest risk of euthanization — from open-admission municipal shelters, no-kill rescues, fosters, homes, and retirement communities.",
        },
      ],
      script: [
        {
          /* Apply the saved theme before first paint. Without this, SSR always
             ships dark markup and light-mode users get a dark flash. */
          innerHTML:
            "try{if(localStorage.getItem('rm-theme')==='light')document.documentElement.classList.add('light')}catch(e){}",
          tagPosition: "head",
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
