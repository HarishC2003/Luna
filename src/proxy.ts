import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { getFeatureFlag } from '@/lib/feature-flags';
import { Redis } from '@upstash/redis';

let redis: Redis | null = null;
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
}

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder',
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set({ name, value, ...options }));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  let user = null;
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error && error.code !== 'refresh_token_not_found') {
      // Only log unexpected fatal errors, ignore common session expirations
      console.warn("Auth verify silent fail:", error.message);
    }
    user = data?.user || null;
  } catch (error) {
    // Fail silently, user will be treated as guest
  }

  const url = request.nextUrl.clone();
  const path = url.pathname;

  // 1. Feature Flag: new_registrations_open check
  if (path === '/api/auth/register' && request.method === 'POST') {
    const open = await getFeatureFlag('new_registrations_open');
    if (!open) {
      return NextResponse.json({ error: 'New registrations are temporarily paused. Please try again later.' }, { status: 503 });
    }
  }

  // 2. Feature Flag: maintenance_mode check (Protect user dashboard areas, ignore admin and API)
  if (path.startsWith('/dashboard') || path.startsWith('/chat') || path.startsWith('/cycles') || path.startsWith('/history') || path.startsWith('/profile')) {
    const maintenance = await getFeatureFlag('maintenance_mode');
    if (maintenance) {
      // Allow admins to bypass maintenance page
      let isAdmin = false;
      if (user) {
        const { data: p } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
        isAdmin = p?.role === 'admin';
      }
      if (!isAdmin) {
        return NextResponse.redirect(new URL('/maintenance', request.url));
      }
    }
  }

  // Protect /api routes
  if (path.startsWith('/api') && !path.startsWith('/api/auth') && !path.startsWith('/api/cron')) {
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  // Dashboard & Profile protection
  if (path.startsWith('/dashboard') || path.startsWith('/chat') || path.startsWith('/cycles') || path.startsWith('/history') || path.startsWith('/profile')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // 3. Admin route protection (Hardened 403 response on API)
  if (path.startsWith('/admin') || path.startsWith('/api/admin')) {
    if (!user) {
      if (path.startsWith('/api/admin')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      return NextResponse.redirect(new URL('/login', request.url));
    }
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
    
    if (!profile || profile.role !== 'admin') {
      if (path.startsWith('/api/admin')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      } else {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }
  }

  // 4. Suspended user check
  if (user && !path.startsWith('/api/auth')) {
    const isProtected = path.startsWith('/dashboard') || path.startsWith('/chat') || path.startsWith('/profile') || path.startsWith('/cycles') || path.startsWith('/history') || (path.startsWith('/api') && !path.startsWith('/api/cron'));
    
    if (isProtected) {
      let isSuspended = false;
      const cacheKey = `suspend:${user.id}`;
      
      if (redis) {
        const cached = await redis.get(cacheKey);
        if (cached === 'true') isSuspended = true;
        else if (cached === 'false') isSuspended = false;
        else {
          const { data: susp } = await supabase.from('user_suspensions').select('id').eq('user_id', user.id).is('lifted_at', null).maybeSingle();
          isSuspended = !!susp;
          await redis.set(cacheKey, isSuspended ? 'true' : 'false', { ex: 300 }); // 5 min cache
        }
      } else {
        const { data: susp } = await supabase.from('user_suspensions').select('id').eq('user_id', user.id).is('lifted_at', null).maybeSingle();
        isSuspended = !!susp;
      }

      if (isSuspended) {
        if (path.startsWith('/api')) {
          return NextResponse.json({ error: 'Your account has been suspended. Contact support.' }, { status: 403 });
        } else {
          // If accessing page UI, return a specialized JSON response or redirect. Wait! Simple Next Response will show the string.
          return new NextResponse('Your account has been suspended. Contact support.', { status: 403 });
        }
      }
    }
  }

  // Redirect authenticated users away from auth pages
  if ((path.startsWith('/login') || path.startsWith('/register')) && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Security Headers
  supabaseResponse.headers.set('X-Frame-Options', 'DENY');
  supabaseResponse.headers.set('X-Content-Type-Options', 'nosniff');
  supabaseResponse.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  supabaseResponse.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
