import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('unauthenticated user is redirected to login', async ({ page, context }) => {
    // Clear auth for this test only
    await context.clearCookies()
    await page.goto('/')
    await expect(page).toHaveURL(/\/login/)
  })

  test('login page renders correctly', async ({ page, context }) => {
    await context.clearCookies()
    await page.goto('/login')
    await expect(page.getByText('光合創學')).toBeVisible()
    await expect(page.getByText('使用 Google 帳號登入')).toBeVisible()
  })

  test('authenticated user can access dashboard', async ({ page }) => {
    // Uses the authenticated state from global.setup
    await page.goto('/')
    await expect(page.getByText('CRM 看板')).toBeVisible()
    await expect(page).not.toHaveURL(/\/login/)
  })

  test('sidebar shows all nav items', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('link', { name: /CRM 看板/ })).toBeVisible()
    await expect(page.getByRole('link', { name: /專案管理/ })).toBeVisible()
    await expect(page.getByRole('link', { name: /銷售管線/ })).toBeVisible()
    await expect(page.getByRole('link', { name: /財務總覽/ })).toBeVisible()
    await expect(page.getByRole('link', { name: /教育訓練/ })).toBeVisible()
    await expect(page.getByRole('link', { name: /AI 戰略/ })).toBeVisible()
    await expect(page.getByRole('link', { name: /儀表板/ })).toBeVisible()
  })

  test('404 page works', async ({ page }) => {
    await page.goto('/non-existent-page-xyz')
    await expect(page.getByText('404')).toBeVisible()
    await expect(page.getByText('找不到這個頁面')).toBeVisible()
  })
})
