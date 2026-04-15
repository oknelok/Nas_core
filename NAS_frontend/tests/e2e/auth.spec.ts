import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('redirects unauthenticated user from /dashboard to /login', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login/)
  })

  test('shows error on wrong credentials', async ({ page }) => {
    await page.goto('/login')
    await page.fill('#username', 'admin')
    await page.fill('#password', 'wrongpassword')
    await page.click('button[type=submit]')
    await expect(page.getByRole('alert')).toContainText('Invalid credentials')
  })

  test('logs in with correct credentials and lands on dashboard', async ({ page }) => {
    await page.goto('/login')
    await page.fill('#username', process.env.E2E_DRUPAL_USER ?? 'admin')
    await page.fill('#password', process.env.E2E_DRUPAL_PASS ?? 'admin')
    await page.click('button[type=submit]')
    await expect(page).toHaveURL(/\/dashboard/)
  })

  test('logout clears session and redirects to login', async ({ page }) => {
    // Login first
    await page.goto('/login')
    await page.fill('#username', process.env.E2E_DRUPAL_USER ?? 'admin')
    await page.fill('#password', process.env.E2E_DRUPAL_PASS ?? 'admin')
    await page.click('button[type=submit]')
    await expect(page).toHaveURL(/\/dashboard/)

    // Logout via the button (assumes dashboard has a logout button)
    await page.click('[data-testid=logout-button]')
    await expect(page).toHaveURL(/\/login/)

    // Confirm session is gone
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login/)
  })
})
