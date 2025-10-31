import { test, expect } from '@playwright/test'

/**
 * End-to-End Tests for Code Platform
 * Tests the full user journey from app creation to AI editing
 */

// Test configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'
const TEST_VENDOR_EMAIL = 'test@floradistro.com' // You'll need a test vendor account

test.describe('Code Platform E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to vendor dashboard
    await page.goto(BASE_URL)
  })

  test('should display Code app tile in dashboard', async ({ page }) => {
    // Navigate to vendor dashboard apps page
    await page.goto(`${BASE_URL}/vendor/apps`)

    // Check if Code app tile exists
    const codeApp = page.locator('text=Code')
    await expect(codeApp).toBeVisible()

    // Check description
    const description = page.locator('text=Build custom apps with AI')
    await expect(description).toBeVisible()
  })

  test('should navigate to Code platform', async ({ page }) => {
    await page.goto(`${BASE_URL}/vendor/apps`)

    // Click on Code app tile
    await page.click('text=Code')

    // Should navigate to /vendor/code
    await expect(page).toHaveURL(`${BASE_URL}/vendor/code`)

    // Check for "Create New App" button or empty state
    const hasApps = await page.locator('[data-testid="app-card"]').count()
    if (hasApps === 0) {
      await expect(page.locator('text=Create Your First App')).toBeVisible()
    }
  })

  test('should show app creation page', async ({ page }) => {
    await page.goto(`${BASE_URL}/vendor/code`)

    // Click "Create New App" button
    await page.click('text=Create New App')

    // Should navigate to /vendor/code/new
    await expect(page).toHaveURL(`${BASE_URL}/vendor/code/new`)

    // Check for template options
    await expect(page.locator('text=Storefront')).toBeVisible()
    await expect(page.locator('text=Admin Panel')).toBeVisible()
    await expect(page.locator('text=Custom App')).toBeVisible()
  })

  test('should validate app creation form', async ({ page }) => {
    await page.goto(`${BASE_URL}/vendor/code/new`)

    // Try to create without selecting template
    const createButton = page.locator('button:has-text("Create App")')
    await expect(createButton).toBeDisabled()

    // Select a template
    await page.click('text=Custom App')
    await page.click('text=Select')

    // Still disabled without name
    await expect(createButton).toBeDisabled()

    // Enter app name
    await page.fill('input[placeholder*="App name"]', 'Test E2E App')

    // Now button should be enabled
    await expect(createButton).toBeEnabled()
  })

  test('should create app and redirect to editor', async ({ page }) => {
    await page.goto(`${BASE_URL}/vendor/code/new`)

    // Select Custom App template
    await page.click('text=Custom App')
    await page.click('text=Select')

    // Fill in app details
    await page.fill('input[placeholder*="App name"]', `E2E Test App ${Date.now()}`)
    await page.fill('textarea[placeholder*="description"]', 'Testing app creation flow')

    // Create app
    await page.click('button:has-text("Create App")')

    // Wait for navigation to editor
    await page.waitForURL(/\/vendor\/code\/[a-f0-9-]+/, { timeout: 30000 })

    // Check if editor loaded
    await expect(page.locator('text=AI Assistant')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('text=Live Preview')).toBeVisible()
  })

  test('should display building status', async ({ page }) => {
    // This test assumes an app is being built
    // Navigate to an app that's in "building" status
    await page.goto(`${BASE_URL}/vendor/code`)

    const appCards = page.locator('[data-testid="app-card"]')
    const count = await appCards.count()

    if (count > 0) {
      // Click first app
      await appCards.first().click()

      // Check for building status or deployed status
      const buildingMessage = page.locator('text=Building your app')
      const previewFrame = page.locator('iframe')

      // Either should be visible
      const isBuilding = await buildingMessage.isVisible().catch(() => false)
      const hasPreview = await previewFrame.isVisible().catch(() => false)

      expect(isBuilding || hasPreview).toBeTruthy()
    }
  })

  test('should show AI chat interface', async ({ page }) => {
    await page.goto(`${BASE_URL}/vendor/code`)

    const appCards = page.locator('[data-testid="app-card"]')
    const count = await appCards.count()

    if (count > 0) {
      await appCards.first().click()

      // Check AI chat elements
      await expect(page.locator('text=AI Assistant')).toBeVisible()
      await expect(page.locator('textarea[placeholder*="Tell me what to build"]')).toBeVisible()
      await expect(page.locator('button[aria-label="Send message"]')).toBeVisible()

      // Check for initial AI message
      await expect(page.locator('text=I\'m your AI coding assistant')).toBeVisible()
    }
  })

  test('should send message to AI (without deploying)', async ({ page }) => {
    await page.goto(`${BASE_URL}/vendor/code`)

    const appCards = page.locator('[data-testid="app-card"]')
    const count = await appCards.count()

    if (count > 0) {
      await appCards.first().click()

      // Type a simple message
      const textarea = page.locator('textarea[placeholder*="Tell me what to build"]')
      await textarea.fill('What can you help me with?')

      // Send message
      await textarea.press('Enter')

      // Check for loading state
      await expect(page.locator('text=Thinking')).toBeVisible({ timeout: 5000 })

      // Wait for AI response
      await expect(page.locator('text=Thinking')).not.toBeVisible({ timeout: 30000 })

      // Should have AI response
      const messages = page.locator('[data-testid="chat-message"]')
      const messageCount = await messages.count()
      expect(messageCount).toBeGreaterThan(1) // User message + AI response
    }
  })

  test('should handle app deletion', async ({ page }) => {
    await page.goto(`${BASE_URL}/vendor/code`)

    // Create a test app first
    await page.click('text=Create New App')
    await page.click('text=Custom App')
    await page.click('text=Select')
    await page.fill('input[placeholder*="App name"]', `Delete Test ${Date.now()}`)
    await page.click('button:has-text("Create App")')

    // Wait for creation
    await page.waitForTimeout(2000)

    // Go back to list
    await page.goto(`${BASE_URL}/vendor/code`)

    // Find the test app and delete it
    const deleteButtons = page.locator('button[aria-label="Delete app"]')
    const count = await deleteButtons.count()

    if (count > 0) {
      await deleteButtons.first().click()

      // Confirm deletion
      await page.click('button:has-text("Delete")')

      // Should show success message or app should be removed
      await page.waitForTimeout(1000)
    }
  })

  test('should validate deployment URL format', async ({ page }) => {
    await page.goto(`${BASE_URL}/vendor/code`)

    const appCards = page.locator('[data-testid="app-card"]')
    const count = await appCards.count()

    if (count > 0) {
      await appCards.first().click()

      // Check if "View Live" link exists
      const viewLiveLink = page.locator('a:has-text("View Live")')
      const isVisible = await viewLiveLink.isVisible().catch(() => false)

      if (isVisible) {
        const href = await viewLiveLink.getAttribute('href')
        expect(href).toMatch(/https:\/\/.*\.vercel\.app/)
      }
    }
  })

  test('should display preview iframe when deployed', async ({ page }) => {
    await page.goto(`${BASE_URL}/vendor/code`)

    const appCards = page.locator('[data-testid="app-card"]')
    const count = await appCards.count()

    if (count > 0) {
      await appCards.first().click()

      // Wait for iframe to load
      const iframe = page.locator('iframe')
      await expect(iframe).toBeVisible({ timeout: 60000 })

      // Check iframe has src
      const src = await iframe.getAttribute('src')
      expect(src).toBeTruthy()
      expect(src).toContain('http')
    }
  })

  test('should show publish button', async ({ page }) => {
    await page.goto(`${BASE_URL}/vendor/code`)

    const appCards = page.locator('[data-testid="app-card"]')
    const count = await appCards.count()

    if (count > 0) {
      await appCards.first().click()

      // Check for publish button
      const publishButton = page.locator('button:has-text("Publish to Production")')
      await expect(publishButton).toBeVisible()
      await expect(publishButton).toBeEnabled()
    }
  })

  test('should handle network errors gracefully', async ({ page }) => {
    // Simulate offline mode
    await page.context().setOffline(true)

    await page.goto(`${BASE_URL}/vendor/code`)

    const appCards = page.locator('[data-testid="app-card"]')
    const count = await appCards.count()

    if (count > 0) {
      await appCards.first().click()

      const textarea = page.locator('textarea[placeholder*="Tell me what to build"]')
      await textarea.fill('Test message')
      await textarea.press('Enter')

      // Should show error
      await expect(page.locator('text=error')).toBeVisible({ timeout: 10000 })
    }

    // Restore connection
    await page.context().setOffline(false)
  })

  test('should auto-refresh preview after AI edit', async ({ page }) => {
    await page.goto(`${BASE_URL}/vendor/code`)

    const appCards = page.locator('[data-testid="app-card"]')
    const count = await appCards.count()

    if (count > 0) {
      await appCards.first().click()

      // Wait for initial load
      await page.waitForTimeout(2000)

      // Send AI edit command
      const textarea = page.locator('textarea[placeholder*="Tell me what to build"]')
      await textarea.fill('Change the welcome text to say "Hello E2E Test"')
      await textarea.press('Enter')

      // Wait for AI response
      await expect(page.locator('text=Thinking')).toBeVisible({ timeout: 5000 })
      await expect(page.locator('text=Thinking')).not.toBeVisible({ timeout: 30000 })

      // Check if files were changed
      const filesChanged = page.locator('text=Files updated')
      const hasChanges = await filesChanged.isVisible().catch(() => false)

      if (hasChanges) {
        // Wait for preview to refresh (3 second delay + deploy time)
        await page.waitForTimeout(10000)

        // Preview should have been refreshed
        const iframe = page.locator('iframe')
        const src = await iframe.getAttribute('src')
        expect(src).toContain('_refresh') // Check for refresh param
      }
    }
  })
})

test.describe('Code Platform - Edge Cases', () => {
  test('should handle very long app names', async ({ page }) => {
    await page.goto(`${BASE_URL}/vendor/code/new`)

    await page.click('text=Custom App')
    await page.click('text=Select')

    const longName = 'A'.repeat(300)
    await page.fill('input[placeholder*="App name"]', longName)

    const createButton = page.locator('button:has-text("Create App")')
    await expect(createButton).toBeEnabled()
  })

  test('should handle special characters in app names', async ({ page }) => {
    await page.goto(`${BASE_URL}/vendor/code/new`)

    await page.click('text=Custom App')
    await page.click('text=Select')

    await page.fill('input[placeholder*="App name"]', 'Test!@#$%^&*()')

    const createButton = page.locator('button:has-text("Create App")')
    await expect(createButton).toBeEnabled()
  })

  test('should handle concurrent AI requests', async ({ page }) => {
    await page.goto(`${BASE_URL}/vendor/code`)

    const appCards = page.locator('[data-testid="app-card"]')
    const count = await appCards.count()

    if (count > 0) {
      await appCards.first().click()

      const textarea = page.locator('textarea[placeholder*="Tell me what to build"]')

      // Send first message
      await textarea.fill('First message')
      await textarea.press('Enter')

      // Try to send second message immediately
      await textarea.fill('Second message')
      const sendButton = page.locator('button[aria-label="Send message"]')

      // Button should be disabled while first request is processing
      await expect(sendButton).toBeDisabled({ timeout: 1000 })
    }
  })

  test('should recover from failed app creation', async ({ page }) => {
    await page.goto(`${BASE_URL}/vendor/code/new`)

    await page.click('text=Custom App')
    await page.click('text=Select')

    // Use name that might cause issues
    await page.fill('input[placeholder*="App name"]', '')

    const createButton = page.locator('button:has-text("Create App")')

    // Should be disabled with empty name
    await expect(createButton).toBeDisabled()
  })
})

test.describe('Code Platform - Performance', () => {
  test('should load app list quickly', async ({ page }) => {
    const startTime = Date.now()

    await page.goto(`${BASE_URL}/vendor/code`)

    // Wait for content to be visible
    await page.waitForSelector('text=Code', { timeout: 5000 })

    const loadTime = Date.now() - startTime

    // Should load in under 3 seconds
    expect(loadTime).toBeLessThan(3000)
  })

  test('should load editor quickly', async ({ page }) => {
    await page.goto(`${BASE_URL}/vendor/code`)

    const appCards = page.locator('[data-testid="app-card"]')
    const count = await appCards.count()

    if (count > 0) {
      const startTime = Date.now()

      await appCards.first().click()

      // Wait for editor to be fully loaded
      await expect(page.locator('text=AI Assistant')).toBeVisible()

      const loadTime = Date.now() - startTime

      // Should load in under 2 seconds
      expect(loadTime).toBeLessThan(2000)
    }
  })
})
