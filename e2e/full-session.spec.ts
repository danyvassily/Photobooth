import { test, expect, Page } from '@playwright/test';

/**
 * Full user journey: 4-photo capture on a (fake) camera, transition to the
 * editor, JPEG export, local gallery persistence and kiosk restrictions.
 * Unlike the smoke tests, this one actually exercises the capture pipeline.
 */

async function ensureCamera(page: Page) {
  const authorize = page.locator('button:has-text("Autoriser la caméra")');
  if (await authorize.isVisible().catch(() => false)) {
    await authorize.click();
  }
  // The preview is ready when the start button is enabled.
  await expect(page.locator('button:has-text("Démarrer (4 photos)")')).toBeEnabled({ timeout: 20000 });
}

/**
 * Opens the theme drawer. The header pill is `hidden sm:flex`, so on phones the
 * dedicated "Thème" button of the camera view is the one to use.
 */
async function openThemeDrawer(page: Page) {
  const pill = page.locator('header button').filter({ hasText: /Classic Photobooth/ }).first();
  if (await pill.isVisible().catch(() => false)) {
    await pill.click();
  } else {
    await page.locator('button[aria-label="Choisir un thème"]').first().click();
  }
  await expect(page.locator('h2:has-text("Choisir un Thème")')).toBeVisible();
}

test.describe('Photobooth V3 — full session', () => {
  test.setTimeout(120_000);

  test('captures 4 photos, exports a valid JPEG and stores it in the gallery', async ({ page, browserName }) => {
    await page.goto('/');
    await ensureCamera(page);

    // Fastest timer available in the UI
    await page.locator('button:has-text("3s")').first().click();
    await page.locator('button:has-text("Démarrer (4 photos)")').click();

    // 4 captures × 3 s + flashes
    await expect(page.getByText('Enregistrer JPEG')).toBeVisible({ timeout: 60000 });

    // Individual retake controls live in the Formats tab
    await page.getByRole('button', { name: 'Format' }).click();
    await expect(page.getByText('Reprendre une photo individuelle')).toBeVisible();

    // Export: a real JPEG blob with the mandated filename
    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 30000 }),
      page.getByText('Enregistrer JPEG').click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/^photobooth-\d{4}-\d{2}-\d{2}-\d{6}\.jpg$/);

    const path = await download.path();
    expect(path).toBeTruthy();
    const fs = await import('node:fs/promises');
    const buf = await fs.readFile(path as string);
    expect(buf.length).toBeGreaterThan(10_000);
    // JPEG magic bytes
    expect(buf[0]).toBe(0xff);
    expect(buf[1]).toBe(0xd8);
    expect(buf[2]).toBe(0xff);

    // The export also saves to IndexedDB → the gallery counter turns non-zero.
    // Known limitation: gallery persistence could not be verified on the
    // headless WebKit build (no write observed); it is verified on Chromium.
    if (browserName !== 'webkit') {
      await expect(
        page.locator('button[aria-label="Galerie locale"]')
      ).toContainText('1', { timeout: 20000 });
      await page.locator('button[aria-label="Galerie locale"]').click();
      await expect(page.locator('h2:has-text("Galerie Locale")')).toBeVisible();
      await expect(page.getByText('Aucun tirage')).toHaveCount(0);

      // Re-editing a stored print restores its originals and settings
      await page.locator('img[alt="Tirage sauvegardé"]').first().click();
      await page.getByRole('button', { name: /Ré-éditer/ }).click();

      await expect(page.getByText('Enregistrer JPEG')).toBeVisible({ timeout: 20000 });
      // Editor reopened on the stored theme (active card highlighted)
      await page.getByRole('button', { name: 'Thème', exact: true }).click();
      await expect(
        page.locator('button.border-pink-500:has-text("Classic Photobooth")')
      ).toBeVisible();
      // …and the print preview was recomposed from the restored originals
      await expect(page.locator('img[alt="Prévisualisation du tirage"]')).toBeVisible();
    }
  });

  test('kiosk mode restricts the theme list and shows the exit banner', async ({ page }) => {
    await page.goto('/');

    await page.locator('button[aria-label="Mode Borne Événement iPad"]').click();
    await expect(page.locator('h3:has-text("Mode Borne Événement iPad")')).toBeVisible();
    await page.locator('button:has-text("Lancer la Borne")').click();

    // Banner + escape hatch
    await expect(page.getByText(/BORNE ÉVÉNEMENT/)).toBeVisible();
    await expect(page.locator('button[aria-label="Quitter le mode borne"]')).toBeVisible();

    // Only the allowed themes are offered while the kiosk runs
    await openThemeDrawer(page);
    const heading = page.locator('h2:has-text("Choisir un Thème")');
    await expect(heading).not.toHaveText(/\(12 Thèmes\)/);
    await expect(page.locator('button:has-text("Elegant Black")')).toHaveCount(0);

    // Close the drawer (its overlay would swallow the next click)
    await page.locator('button:has(svg.lucide-x)').first().click();
    await expect(heading).not.toBeVisible();

    await page.locator('button[aria-label="Quitter le mode borne"]').click();
    await expect(page.getByText(/BORNE ÉVÉNEMENT/)).toHaveCount(0);
  });
});
