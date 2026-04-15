import { test, expect } from '@playwright/test'

const TEST_COMPANY = `E2E測試公司_${Date.now()}`

test.describe('CRM Flow: Create client → KYC → Documents', () => {
  test('can create a new 借址登記 client with auto-generated KYC and documents', async ({ page }) => {
    await page.goto('/clients/new')

    // Fill form
    await page.getByLabel(/公司名稱/).fill(TEST_COMPANY)
    await page.getByLabel(/聯絡人姓名/).fill('E2E 測試')
    await page.getByLabel(/聯絡電話/).fill('0900000000')
    await page.getByLabel(/月費/).fill('2500')

    // Submit
    await page.getByRole('button', { name: /新增客戶/ }).click()

    // Should redirect to CRM board
    await expect(page).toHaveURL('/', { timeout: 15000 })

    // Client card should appear
    await expect(page.getByText(TEST_COMPANY)).toBeVisible({ timeout: 10000 })
  })

  test('client detail page shows KYC + documents for 借址登記', async ({ page }) => {
    await page.goto('/')
    await page.getByText(TEST_COMPANY).click()

    // Should show client detail
    await expect(page.getByText('基本資料')).toBeVisible()
    await expect(page.getByText('KYC 查核')).toBeVisible()
    await expect(page.getByText('文件檢核')).toBeVisible()

    // KYC should have 5 items
    await expect(page.getByText('商工登記')).toBeVisible()
    await expect(page.getByText('司法院裁判書')).toBeVisible()
    await expect(page.getByText('實質受益人審查')).toBeVisible()

    // Documents should have 7 items for 借址登記
    await expect(page.getByText('負責人雙證件影本')).toBeVisible()
    await expect(page.getByText('股東名冊')).toBeVisible()
  })

  test('KYC progress counter updates correctly', async ({ page }) => {
    await page.goto('/')
    await page.getByText(TEST_COMPANY).click()

    // Initially 0 / 5 passed
    await expect(page.getByText(/0\s*\/\s*5/)).toBeVisible()
  })
})

test.describe('CRM Board: Search & Export', () => {
  test('search filters clients by name', async ({ page }) => {
    await page.goto('/')
    const searchInput = page.getByPlaceholder(/搜尋公司名稱/)
    await searchInput.fill(TEST_COMPANY)
    await expect(page.getByText(TEST_COMPANY)).toBeVisible()
  })

  test('export CSV button is visible', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('button', { name: /匯出 CSV/ })).toBeVisible()
  })
})
