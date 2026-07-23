import * as Sentry from "@sentry/nuxt";

/* Inert until a DSN is provided, so local dev and key-less deploys stay quiet.
   Set NUXT_PUBLIC_SENTRY_DSN in .env (or the Netlify dashboard) to switch on. */
const dsn = useRuntimeConfig().public.sentryDsn as string | undefined;

if (dsn) {
  Sentry.init({
    dsn,
    // sample lightly; this is a small app, not a firehose
    tracesSampleRate: 0.2,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1.0,
  });
}
