import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { rateLimit, getClientKey } from '@/lib/rate-limit'

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // ── Rate limiting for API routes ───────────────────────
  if (pathname.startsWith('/api/')) {
    const key = getClientKey(request)
    const isWrite = request.method !== 'GET' && request.method !== 'HEAD' && request.method !== 'OPTIONS'
    const { allowed, remaining, resetAt } = rateLimit(key, {
      limit: isWrite ? 30 : 100, // 30 writes or 100 reads per minute per IP
      windowMs: 60_000,
    })

    if (!allowed) {
      return new NextResponse(
        JSON.stringify({ error: '請求過於頻繁，請稍後再試' }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(Math.ceil((resetAt - Date.now()) / 1000)),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Math.ceil(resetAt / 1000)),
          },
        }
      )
    }

    const response = await runAuth(request)
    response.headers.set('X-RateLimit-Remaining', String(remaining))
    response.headers.set('X-RateLimit-Reset', String(Math.ceil(resetAt / 1000)))
    return response
  }

  return runAuth(request)
}

async function runAuth(request: NextRequest): Promise<NextResponse> {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (
    !user &&
    !request.nextUrl.pathname.startsWith('/login') &&
    !request.nextUrl.pathname.startsWith('/auth')
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
