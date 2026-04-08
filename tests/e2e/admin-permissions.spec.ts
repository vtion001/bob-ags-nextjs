import { test, expect } from '@playwright/test'

test.describe('Admin Role Permissions', () => {
  // Using dev bypass credentials that work with local development
  const ADMIN_EMAIL = 'agsdev@allianceglobalsolutions.com'
  const ADMIN_PASSWORD = 'ags2026@@'

  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('should login as admin user', async ({ page }) => {
    // Fill in login form
    await page.fill('input[type="email"]', ADMIN_EMAIL)
    await page.fill('input[type="password"]', ADMIN_PASSWORD)

    // Submit the form
    await page.click('button[type="submit"]')

    // Wait for redirect to dashboard
    await page.waitForURL('**/dashboard**', { timeout: 30000 })

    // Verify we're on the dashboard
    await expect(page).toHaveURL(/\/dashboard/)
  })

  test('1. /dashboard/calls - should be accessible', async ({ page }) => {
    // Login first
    await page.fill('input[type="email"]', ADMIN_EMAIL)
    await page.fill('input[type="password"]', ADMIN_PASSWORD)
    await page.click('button[type="submit"]')
    await page.waitForURL('**/dashboard**', { timeout: 30000 })

    // Navigate to calls page
    await page.goto('/dashboard/calls')
    await page.waitForLoadState('networkidle')

    // Verify page loaded
    expect(page.url()).toContain('/dashboard/calls')

    // Verify no access denied error
    const errorText = await page.textContent('body')
    expect(errorText).not.toContain('Access Denied')
    expect(errorText).not.toContain('Unauthorized')
  })

  test('2. /dashboard/monitor - should be accessible', async ({ page }) => {
    // Login first
    await page.fill('input[type="email"]', ADMIN_EMAIL)
    await page.fill('input[type="password"]', ADMIN_PASSWORD)
    await page.click('button[type="submit"]')
    await page.waitForURL('**/dashboard**', { timeout: 30000 })

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

  test('3. /dashboard/history - should be accessible with Bulk Analyze button', async ({ page }) => {
    // Login first
    await page.fill('input[type="email"]', ADMIN_EMAIL)
    await page.fill('input[type="password"]', ADMIN_PASSWORD)
    await page.click('button[type="submit"]')
    await page.waitForURL('**/dashboard**', { timeout: 30000 })

    // Navigate to history page
    await page.goto('/dashboard/history')
    await page.waitForLoadState('networkidle')

    // Verify page loaded
    expect(page.url()).toContain('/dashboard/history')

    // Verify no access denied error
    const errorText = await page.textContent('body')
    expect(errorText).not.toContain('Access Denied')
    expect(errorText).not.toContain('Unauthorized')

    // Verify Bulk Analyze button is visible
    const bulkAnalyzeButton = page.getByRole('button', { name: /bulk analyze/i })
    await expect(bulkAnalyzeButton).toBeVisible()
  })

  test('4. /dashboard/agents - should be accessible', async ({ page }) => {
    // Login first
    await page.fill('input[type="email"]', ADMIN_EMAIL)
    await page.fill('input[type="password"]', ADMIN_PASSWORD)
    await page.click('button[type="submit"]')
    await page.waitForURL('**/dashboard**', { timeout: 30000 })

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

  test('5. /dashboard/qa-logs - should be accessible', async ({ page }) => {
    // Login first
    await page.fill('input[type="email"]', ADMIN_EMAIL)
    await page.fill('input[type="password"]', ADMIN_PASSWORD)
    await page.click('button[type="submit"]')
    await page.waitForURL('**/dashboard**', { timeout: 30000 })

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

  test('6. /dashboard/settings - should show User Permissions section', async ({ page }) => {
    // Login first
    await page.fill('input[type="email"]', ADMIN_EMAIL)
    await page.fill('input[type="password"]', ADMIN_PASSWORD)
    await page.click('button[type="submit"]')
    await page.waitForURL('**/dashboard**', { timeout: 30000 })

    // Navigate to settings page
    await page.goto('/dashboard/settings')

    // Wait for page content to be visible (settings page may make API calls)
    await page.waitForSelector('h1:has-text("Settings")', { timeout: 10000 })

    // Verify page loaded
    expect(page.url()).toContain('/dashboard/settings')

    // Verify no access denied error
    const errorText = await page.textContent('body')
    expect(errorText).not.toContain('Access Denied')
    expect(errorText).not.toContain('Unauthorized')

    // Verify User Permissions section is visible (admin-only)
    const userPermissionsHeading = page.getByRole('heading', { name: /user permissions/i })
    await expect(userPermissionsHeading).toBeVisible({ timeout: 10000 })
  })

  test('7. Verify Bulk Analyze button visibility on history page', async ({ page }) => {
    // Login first
    await page.fill('input[type="email"]', ADMIN_EMAIL)
    await page.fill('input[type="password"]', ADMIN_PASSWORD)
    await page.click('button[type="submit"]')
    await page.waitForURL('**/dashboard**', { timeout: 30000 })

    // Navigate to history page
    await page.goto('/dashboard/history')
    await page.waitForLoadState('networkidle')

    // Verify Bulk Analyze button exists and is visible
    const bulkAnalyzeButton = page.getByRole('button', { name: /bulk analyze/i })
    await expect(bulkAnalyzeButton).toBeVisible()

    // Verify Export CSV button is also visible
    const exportButton = page.getByRole('button', { name: /export csv/i })
    await expect(exportButton).toBeVisible()
  })
})