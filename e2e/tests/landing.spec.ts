import { expect, test } from '@playwright/test';

test('landing shows intro, directions and leads to catalog', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Тренуйтеся');
  await expect(page.getByTestId('landing-stats')).toContainText('секцій');
  await expect(page.getByRole('heading', { name: 'Чому Арена' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Наші центри' })).toBeVisible();
  await expect(page.locator('.tier-card')).toHaveCount(3);

  await page.locator('.sport-tile', { hasText: 'Плавання' }).click();
  await expect(page).toHaveURL(/\/catalog\?sport=swimming/);
  await expect(page.getByTestId('section-list').getByRole('link')).toHaveCount(2);

  await page.goto('/');
  await page.getByRole('link', { name: 'Орендувати зал' }).click();
  await expect(page.getByTestId('hall-list').getByRole('link')).toHaveCount(7);
});

test('images are served', async ({ request }) => {
  for (const name of ['hero', 'football', 'yoga', 'swimming']) {
    const res = await request.get(`/img/${name}.jpg`);
    expect(res.ok()).toBeTruthy();
    expect(res.headers()['content-type']).toContain('image/jpeg');
  }
});
