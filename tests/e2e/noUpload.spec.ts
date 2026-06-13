import { test, expect } from '@playwright/test'
import path from 'path'

test('no binary data is uploaded while processing DICOM files', async ({ page }) => {
  const uploadedBinaryRequests: string[] = []

  page.on('request', (request) => {
    const method = request.method()
    if (method === 'POST' || method === 'PUT') {
      const postDataBuffer = request.postDataBuffer()
      if (postDataBuffer && postDataBuffer.length > 0) {
        uploadedBinaryRequests.push(`${method} ${request.url()} (${postDataBuffer.length} bytes)`)
      }
    }
  })

  await page.goto('/')
  await page.waitForSelector('text=OpenDICOM Convert', { timeout: 15000 })

  const fileInput = page.locator('[data-testid="file-input"]')
  await fileInput.setInputFiles(path.resolve('../../tests/fixtures/sample.dcm'))

  await page.waitForSelector('[data-testid="import-review"]', { timeout: 30000 })

  expect(uploadedBinaryRequests, `Binary data was uploaded — PRIVACY VIOLATION:\n${uploadedBinaryRequests.join('\n')}`).toHaveLength(0)
})
