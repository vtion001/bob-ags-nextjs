import { test, expect } from '@playwright/test'

const QA_EMAIL = 'allyssa@allianceglobalsolutions.com'
const QA_PASSWORD = 'allyssa2026@@'

test.describe('QA Role Permissions', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('1. Login as QA user', async ({ page }) => {
    // Fill in login form
    await page.fill('input[type="email"]', QA_EMAIL)
    await page.fill('input[type="password"]', QA_PASSWORD)

    // Submit the form
    await page.click('button[type="submit"]')

    // Wait for redirect to dashboard
    await page.waitForURL('**/dashboard**', { timeout: 10000 })

    // Verify we're on the dashboard
    await expect(page).toHaveURL(/\/dashboard/)
  })

  test('2. /dashboard/calls - should be accessible', async ({ page }) => {
    // Login first
    await page.fill('input[type="email"]', QA_EMAIL)
    await page.fill('input[type="password"]', QA_PASSWORD)
    await page.click('button[type="submit"]')
    await page.waitForURL('**/dashboard**', { timeout: 10000 })

    // Navigate to calls page
    await page.goto('/dashboard/calls')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    // Verify page loaded
    expect(page.url()).toContain('/dashboard/calls')

    // Verify no access denied error
    const errorText = await page.textContent('body')
    expect(errorText).not.toContain('Access Denied')
    expect(errorText).not.toContain('Unauthorized')
    expect(errorText).not.toContain('No Access')
  })

  test('3. /dashboard/monitor - should be accessible', async ({ page }) => {
    // Login first
    await page.fill('input[type="email"]', QA_EMAIL)
    await page.fill('input[type="password"]', QA_PASSWORD)
    await page.click('button[type="submit"]')
    await page.waitForURL('**/dashboard**', { timeout: 10000 })

    // Navigate to monitor page
    await page.goto('/dashboard/monitor')
    await page.waitForLoadState('networkidle')

    // Verify page loaded
    expect(page.url()).toContain('/dashboard/monitor')

    // Verify no access denied error
    const errorText = await page.textContent('body')
    expect(errorText).not.toContain('Access Denied')
    expect(errorText).not.toContain('Unauthorized')
  })

  test('4. /dashboard/history - should be accessible', async ({ page }) => {
    // Login first
    await page.fill('input[type="email"]', QA_EMAIL)
    await page.fill('input[type="password"]', QA_PASSWORD)
    await page.click('button[type="submit"]')
    await page.waitForURL('**/dashboard**', { timeout: 10000 })

    // Navigate to history page
    await page.goto('/dashboard/history')
    await page.waitForLoadState('networkidle')

    // Verify page loaded
    expect(page.url()).toContain('/dashboard/history')

    // Verify no access denied error
    const errorText = await page.textContent('body')
    expect(errorText).not.toContain('Access Denied')
    expect(errorText).not.toContain('Unauthorized')
  })

  test('5. /dashboard/agents - should be accessible', async ({ page }) => {
    // Login first
    await page.fill('input[type="email"]', QA_EMAIL)
    await page.fill('input[type="password"]', QA_PASSWORD)
    await page.click('button[type="submit"]')
    await page.waitForURL('**/dashboard**', { timeout: 10000 })

    // Navigate to agents page
    await page.goto('/dashboard/agents')
    await page.waitForLoadState('networkidle')

    // Verify page loaded
    expect(page.url()).toContain('/dashboard/agents')

    // Verify no access denied error
    const errorText = await page.textContent('body')
    expect(errorText).not.toContain('Access Denied')
    expect(errorText).not.toContain('Unauthorized')
  })

  test('6. /dashboard/qa-logs - should be accessible', async ({ page }) => {
    // Login first
    await page.fill('input[type="email"]', QA_EMAIL)
    await page.fill('input[type="password"]', QA_PASSWORD)
    await page.click('button[type="submit"]')
    await page.waitForURL('**/dashboard**', { timeout: 10000 })

    // Navigate to qa-logs page
    await page.goto('/dashboard/qa-logs')
    await page.waitForLoadState('networkidle')

    // Verify page loaded
    expect(page.url()).toContain('/dashboard/qa-logs')

    // Verify no access denied error
    const errorText = await page.textContent('body')
    expect(errorText).not.toContain('Access Denied')
    expect(errorText).not.toContain('Unauthorized')
  })

  test('7. /dashboard/settings - User Permissions section should NOT be editable for QA', async ({ page }) => {
    // Login first
    await page.fill('input[type="email"]', QA_EMAIL)
    await page.fill('input[type="password"]', QA_PASSWORD)
    await page.click('button[type="submit"]')
    await page.waitForURL('**/dashboard**', { timeout: 10000 })

    // Navigate to settings page
    await page.goto('/dashboard/settings')
    await page.waitForLoadState('networkidle')

    // Verify page loaded
    expect(page.url()).toContain('/dashboard/settings')

    // Check if User Permissions section is visible
    const userPermissionsHeading = page.getByRole('heading', { name: /user permissions/i })

    if (await userPermissionsHeading.isVisible({ timeout: 3000 })) {
      // If visible, check if it's editable (admin-only)
      // Look for disabled state on permission toggles
      const toggleButtons = page.locator('button[aria-pressed]')
      const firstToggle = toggleButtons.first()

      if (await firstToggle.isVisible()) {
        const isDisabled = await firstToggle.getAttribute('disabled')
        console.log('Permission toggles disabled:', isDisabled !== null)
        // QA should not be able to edit - toggles should be disabled or hidden
        expect(isDisabled).not.toBeNull()
      }
    } else {
      // User Permissions section not visible - correct for QA role
      console.log('User Permissions section not visible - as expected for QA')
    }
  })

  test('8. History page - Bulk Analyze button should be visible for QA', async ({ page }) => {
    // Login first
    await page.fill('input[type="email"]', QA_EMAIL)
    await page.fill('input[type="password"]', QA_PASSWORD)
    await page.click('button[type="submit"]')
    await page.waitForURL('**/dashboard**', { timeout: 10000 })

    // Navigate to history page
    await page.goto('/dashboard/history')
    await page.waitForLoadState('networkidle')

    // Wait for permissions to load and button to appear
    await page.waitForTimeout(2000)

    // Verify page loaded
    expect(page.url()).toContain('/dashboard/history')

    // Verify Bulk Analyze button is visible (QA can run analysis)
    const bulkAnalyzeButton = page.getByRole('button', { name: /bulk analyze/i })
    await expect(bulkAnalyzeButton).toBeVisible({ timeout: 10000 })
  })
})
