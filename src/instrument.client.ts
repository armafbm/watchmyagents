import * as Sentry from "@sentry/tanstackstart-react";

Sentry.init({
  dsn: "https://a1166e2abffb6f111ed97822e539cb47@o4511561626615808.ingest.de.sentry.io/4511561633497168",
  integrations: [
    Sentry.replayIntegration(),
    Sentry.browserTracingIntegration(),
  ],
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  environment: import.meta.env.MODE,
});
