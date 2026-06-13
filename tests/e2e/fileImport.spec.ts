import { test, expect } from '@playwright/test'
import path from 'path'

test('home screen shows app name and privacy notice', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('h1')).toContainText('OpenDICOM Convert', { timeout: 15000 })
  await expect(page.locator('text=processed locally')).toBeVisible()
})

test('user can select a DICOM file and see import review', async ({ page }) => {
  await page.goto('/')
  await page.waitForSelector('text=OpenDICOM Convert', { timeout: 15000 })

  const fileInput = page.locator('[data-testid="file-input"]')
  await fileInput.setInputFiles(path.resolve('../../tests/fixtures/sample.dcm'))

  await page.waitForSelector('[data-testid="import-review"]', { timeout: 30000 })
  await expect(page.locator('text=Valid DICOM files')).toBeVisible()
})

test('user can proceed to viewer after selecting DICOM file', async ({ page }) => {
  await page.goto('/')
  await page.waitForSelector('text=OpenDICOM Convert', { timeout: 15000 })

  const fileInput = page.locator('[data-testid="file-input"]')
  await fileInput.setInputFiles(path.resolve('../../tests/fixtures/sample.dcm'))

  await page.waitForSelector('[data-testid="import-review"]', { timeout: 30000 })
  await page.click('button:has-text("Open Viewer")')

  // Cornerstone renders into a canvas element — give it time to initialise
  await page.waitForTimeout(2000)
  await page.waitForSelector('canvas', { timeout: 30000 })
  await expect(page.locator('canvas').first()).toBeVisible()
})
