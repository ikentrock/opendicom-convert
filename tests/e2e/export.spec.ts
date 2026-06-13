import { test, expect } from '@playwright/test'
import path from 'path'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.waitForSelector('text=OpenDICOM Convert', { timeout: 15000 })

  const fileInput = page.locator('[data-testid="file-input"]')
  await fileInput.setInputFiles(path.resolve('../../tests/fixtures/sample.dcm'))

  await page.waitForSelector('[data-testid="import-review"]', { timeout: 30000 })
  await page.click('button:has-text("Open Viewer")')

  // Cornerstone renders into a canvas element — give it time to initialise
  await page.waitForTimeout(2000)
  await page.waitForSelector('canvas', { timeout: 30000 })
})

test('export panel is visible in the viewer', async ({ page }) => {
  // ExportPanel renders "Export" as a section heading and PNG/JPEG as format buttons
  await expect(page.locator('text=Export').first()).toBeVisible()
  await expect(page.locator('button:has-text("PNG")')).toBeVisible()
  await expect(page.locator('button:has-text("JPEG")')).toBeVisible()
})

test('single image export triggers a file download', async ({ page }) => {
  // Wait for canvas to finish rendering before clicking export
  await page.waitForTimeout(1000)

  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: 30000 }),
    page.click('button:has-text("Export")'),
  ])
  expect(download.suggestedFilename()).toMatch(/image_000001\.(png|jpg)/)
})
