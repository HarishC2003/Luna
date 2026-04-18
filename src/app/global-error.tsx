'use client';

import * as Sentry from '@sentry/nextjs';
import Error from 'next/error';
import { useEffect } from 'react';

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        <div style={{ textAlign: 'center', padding: '50px', fontFamily: 'sans-serif' }}>
           <h1>Something went wrong!</h1>
           <p>A critical crash occurred. Reverting to safe state.</p>
           <button onClick={() => window.location.reload()} style={{ padding: '10px 20px', fontSize: '16px', background: '#E85D9A', color: 'white', border: 'none', borderRadius: '5px' }}>Reload Page</button>
        </div>
      </body>
    </html>
  );
}
