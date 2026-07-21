export default defineNuxtConfig({
  modules: ["@nuxtjs/tailwindcss"],
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
