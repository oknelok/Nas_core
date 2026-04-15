import { test, expect } from '@playwright/test'

async function login(page: import('@playwright/test').Page) {
  await page.goto('/login')
  await page.fill('#username', process.env.E2E_DRUPAL_USER ?? 'admin')
  await page.fill('#password', process.env.E2E_DRUPAL_PASS ?? 'admin')
  await page.click('button[type=submit]')
  await expect(page).toHaveURL(/\/dashboard/)
}

test.describe('Task Console', () => {
  test('redirects unauthenticated user from /tasks to /login', async ({ page }) => {
    await page.goto('/tasks')
    await expect(page).toHaveURL(/\/login/)
  })

  test('task console loads and shows task list or empty state', async ({ page }) => {
    await login(page)
    await page.goto('/tasks')
    await expect(page.getByRole('heading', { name: /task console/i })).toBeVisible()
    const hasTable = await page.locator('table tbody tr').count() > 0
    const hasEmpty = await page.getByTestId('empty-state').isVisible()
    expect(hasTable || hasEmpty).toBeTruthy()
  })

  test('execute button navigates to task page', async ({ page }) => {
    await login(page)
    await page.goto('/tasks')
    const executeBtn = page.locator('[data-testid^="execute-"]').first()
    const count = await executeBtn.count()
    if (count === 0) {
      test.skip()
      return
    }
    const testId = await executeBtn.getAttribute('data-testid')
    const token = testId?.replace('execute-', '')
    await executeBtn.click()
    await expect(page).toHaveURL(new RegExp(`/tasks/${token}`))
  })

  test('task page renders webform fields', async ({ page }) => {
    await login(page)
    await page.goto('/tasks')
    const executeBtn = page.locator('[data-testid^="execute-"]').first()
    if (await executeBtn.count() === 0) {
      test.skip()
      return
    }
    await executeBtn.click()
    await expect(page.locator('form')).toBeVisible()
    await expect(page.locator('button[type=submit]')).toBeVisible()
  })
})
