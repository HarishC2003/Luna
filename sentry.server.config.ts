import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,
  ignoreErrors: ['AbortError', 'FetchError'],
  beforeSend(event) {
    if (event.user && event.user.email) {
      delete event.user.email;
    }
    if (event.request?.data) {
      delete event.request.data;
    }
    if (event.request?.headers) {
      const allowedHeaders = ['method', 'url'];
      const headers = event.request.headers as Record<string, string>;
      for (const key in headers) {
        if (!allowedHeaders.includes(key.toLowerCase())) {
          delete headers[key];
        }
      }
    }
    if (event.exception?.values) {
      event.exception.values.forEach(exc => {
        if (exc.stacktrace?.frames) {
          exc.stacktrace.frames.forEach(frame => {
            if (frame.filename && frame.filename.includes('supabase.co')) {
              frame.filename = '[supabase-url]';
            }
          });
        }
      });
    }
    if (event.request?.url && event.request.url.includes('/api/auth/')) {
      return null;
    }
    return event;
  },
});
