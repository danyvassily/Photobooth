import { test, expect } from '@playwright/test';

test.describe('Photobooth V3 End-to-End Test Suite', () => {
  test('loads home page with title, theme pill and PWA manifest', async ({ page }) => {
    await page.goto('/');

    // Check title
    await expect(page).toHaveTitle(/Photobooth V3/);

    // Check brand header
    await expect(page.locator('header')).toContainText('Photobooth');

    // Check manifest link exists in DOM
    const manifest = await page.locator('link[rel="manifest"]').getAttribute('href');
    expect(manifest).toBe('/manifest.json');
  });

  test('opens theme drawer and selects Korean Life4Cuts theme', async ({ page }) => {
    await page.goto('/');

    // Click on Theme button
    await page.locator('button:has-text("Classic Photobooth")').first().click();

    // Check drawer opened
    await expect(page.locator('h2')).toContainText('Choisir un Thème (12 Thèmes)');

    // Select Korean Life4Cuts
    await page.locator('button:has-text("Korean Life4Cuts")').click();

    // Verify selected theme updated in header
    await expect(page.locator('header')).toContainText('Korean Life4Cuts');
  });

  test('opens benchmark modal and displays engine status', async ({ page }) => {
    await page.goto('/');

    // Click benchmark button
    await page.locator('button[title*="Moteur de traitement"]').click();

    // Modal is visible
    await expect(page.locator('h3:has-text("Benchmarks")')).toBeVisible();

    // Close modal
    await page.locator('button:has(svg.lucide-x)').click();
    await expect(page.locator('h3:has-text("Benchmarks")')).not.toBeVisible();
  });

  test('opens and configures iPad Event Kiosk mode', async ({ page }) => {
    await page.goto('/');

    // Click Kiosk button
    await page.locator('button[aria-label="Mode Borne Événement iPad"]').click();

    // Verify modal elements
    await expect(page.locator('h3:has-text("Mode Borne Événement iPad")')).toBeVisible();
    await expect(page.locator('button:has-text("Lancer la Borne")')).toBeVisible();

    // Close
    await page.locator('button:has-text("Annuler")').click();
  });

  test('opens empty gallery modal and shows local storage status', async ({ page }) => {
    await page.goto('/');

    // Click Gallery button
    await page.locator('button[aria-label="Galerie locale"]').click();

    // Gallery modal opened
    await expect(page.locator('h2:has-text("Galerie Locale")')).toBeVisible();
    await expect(page.locator('text=Confidentialité totale')).toBeVisible();

    // Close
    await page.locator('button:has(svg.lucide-x)').click();
  });
});
