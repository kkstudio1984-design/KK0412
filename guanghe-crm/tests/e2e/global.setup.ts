import { test as setup, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

const AUTH_FILE = 'tests/e2e/.auth/user.json'

setup('authenticate', async ({ page, context }) => {
  const email = process.env.TEST_USER_EMAIL
  const password = process.env.TEST_USER_PASSWORD
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!email || !password || !supabaseUrl || !supabaseKey) {
    throw new Error(
      'Missing test env vars. Set TEST_USER_EMAIL, TEST_USER_PASSWORD, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY'
    )
  }

  // Use Supabase JS SDK to sign in with email/password
  const supabase = createClient(supabaseUrl, supabaseKey)
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error || !data.session) {
    throw new Error(`Login failed: ${error?.message || 'no session'}`)
  }

  // Inject the session tokens into browser cookies (matching @supabase/ssr cookie format)
  const projectRef = supabaseUrl.replace('https://', '').split('.')[0]
  const cookieName = `sb-${projectRef}-auth-token`

  // Supabase uses base64 encoded session in cookie
  const sessionData = {
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
    expires_at: data.session.expires_at,
    expires_in: data.session.expires_in,
    token_type: 'bearer',
    user: data.session.user,
  }

  const baseURL = process.env.BASE_URL || 'http://localhost:3000'
  const url = new URL(baseURL)

  // @supabase/ssr stores the session as a base64-encoded JSON, prefixed with `base64-`
  const encoded = 'base64-' + Buffer.from(JSON.stringify(sessionData)).toString('base64')

  // Split across 2 chunks if too long (Supabase SSR splits by 3180 chars)
  const chunkSize = 3180
  const chunks: string[] = []
  for (let i = 0; i < encoded.length; i += chunkSize) {
    chunks.push(encoded.slice(i, i + chunkSize))
  }

  const cookies = chunks.map((value, i) => ({
    name: chunks.length > 1 ? `${cookieName}.${i}` : cookieName,
    value,
    domain: url.hostname,
    path: '/',
    httpOnly: false,
    secure: url.protocol === 'https:',
    sameSite: 'Lax' as const,
    expires: data.session.expires_at || -1,
  }))

  await context.addCookies(cookies)

  // Verify by navigating to a protected route
  await page.goto('/')
  await expect(page).not.toHaveURL(/\/login/, { timeout: 10000 })

  // Save the authenticated state
  const dir = path.dirname(AUTH_FILE)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  await context.storageState({ path: AUTH_FILE })
})
