import * as Sentry from '@sentry/nextjs';
import crypto from 'crypto';

export function captureAPIError(error: unknown, context: { route: string; userId?: string }): void {
  Sentry.withScope((scope) => {
    scope.setTag('route', context.route);
    
    if (context.userId) {
      const hashedUserId = crypto.createHash('sha256').update(context.userId).digest('hex');
      scope.setUser({ id: hashedUserId });
    }

    Sentry.captureException(error);
  });
}

export function trackAdminAction(action: string, adminId: string): void {
  const hashedAdminId = crypto.createHash('sha256').update(adminId).digest('hex');
  
  Sentry.addBreadcrumb({
    category: 'admin_action',
    message: action,
    level: 'info',
    data: {
      adminId: hashedAdminId
    }
  });
}
