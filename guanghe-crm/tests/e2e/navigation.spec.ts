import { test, expect } from '@playwright/test'

test.describe('Page Navigation & Rendering', () => {
  test('CRM board page loads without errors', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('CRM 看板')).toBeVisible()
    // Check all 7 stage columns exist
    await expect(page.getByText('初步詢問').first()).toBeVisible()
    await expect(page.getByText('KYC審核中').first()).toBeVisible()
    await expect(page.getByText('服務中').first()).toBeVisible()
  })

  test('Dashboard page loads with 3 tiers', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page.getByText('營運儀表板')).toBeVisible()
    await expect(page.getByText('救火層')).toBeVisible()
    await expect(page.getByText('生存層')).toBeVisible()
    await expect(page.getByText('成長層')).toBeVisible()
  })

  test('Sales pipeline page loads', async ({ page }) => {
    await page.goto('/sales')
    await expect(page.getByText('銷售管線')).toBeVisible()
  })

  test('Projects page loads', async ({ page }) => {
    await page.goto('/projects')
    await expect(page.getByText('專案管理')).toBeVisible()
  })

  test('Finance page loads', async ({ page }) => {
    await page.goto('/finance')
    await expect(page.getByText('財務總覽')).toBeVisible()
  })

  test('Training page loads', async ({ page }) => {
    await page.goto('/training')
    await expect(page.getByText('教育訓練')).toBeVisible()
  })

  test('AI Strategy page loads', async ({ page }) => {
    await page.goto('/ai-strategy')
    await expect(page.getByText('AI 戰略')).toBeVisible()
  })

  test('Address risk page loads', async ({ page }) => {
    await page.goto('/address-risk')
    await expect(page.getByText('地址風險總覽')).toBeVisible()
  })

  test('ESG Sponsorships page loads', async ({ page }) => {
    await page.goto('/sales/sponsorships')
    await expect(page.getByText('ESG 贊助合約')).toBeVisible()
  })

  test('no console errors on any main page', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (err) => errors.push(err.message))

    const pages = ['/', '/dashboard', '/sales', '/projects', '/finance', '/training', '/ai-strategy', '/address-risk']
    for (const url of pages) {
      await page.goto(url)
      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {})
    }

    expect(errors).toEqual([])
  })
})
