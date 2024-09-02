import * as Sentry from "@sentry/remix";

Sentry.init({
    dsn: "https://4cd4d2e34a6bd799ebefba3401dc256c@o4507873972584448.ingest.us.sentry.io/4507875513204736",
    tracesSampleRate: 1,
    autoInstrumentRemix: true
})