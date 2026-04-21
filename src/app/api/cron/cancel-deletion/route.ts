import { NextResponse } from 'next/server';
import { cancelAccountDeletion } from '@/lib/privacy/account-deletion';
import { z } from 'zod';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');
  
  if (!token || !z.string().uuid().safeParse(token).success) {
    return new NextResponse('Invalid cancellation token.', { status: 400 });
  }

  try {
    const success = await cancelAccountDeletion(token);
    
    if (!success) {
      return new NextResponse('Link expired or request already processed.', { status: 400 });
    }

    return new NextResponse(
      '<html><body style="font-family:sans-serif;text-align:center;padding:50px;"><h2>Account Deletion Cancelled</h2><p>Your Luna account is safe and will not be deleted.</p><a href="/">Return to Dashboard</a></body></html>',
      { headers: { 'Content-Type': 'text/html' } }
    );
  } catch {
    return new NextResponse('Internal server error', { status: 500 });
  }
}
