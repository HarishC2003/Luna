import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,
  environment: process.env.NODE_ENV,
  beforeSend(event) {
    if (event.user && event.user.email) {
      delete event.user.email;
    }
    if (event.request?.data) {
      delete event.request.data;
    }
    if (event.breadcrumbs) {
      event.breadcrumbs = event.breadcrumbs.map(bc => {
        if (bc.data && bc.data.url && typeof bc.data.url === 'string') {
          bc.data.url = bc.data.url.split('?')[0];
        }
        return bc;
      });
    }
    if (event.request?.url && event.request.url.includes('/api/auth/')) {
      return null;
    }
    return event;
  },
  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
});
