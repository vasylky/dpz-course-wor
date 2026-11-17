import { expect, test } from '@playwright/test';

test('catalog filters by sport, level and age group', async ({ page }) => {
  await page.goto('/catalog');
  const list = page.getByTestId('section-list');
  await expect(list).toContainText('Футбол для дітей');
  await expect(list).toContainText('Плавання для дітей');

  await page.getByLabel('Вид спорту').selectOption({ label: 'Йога' });
  await expect(list.getByRole('link')).toHaveCount(3);

  await page.getByLabel('Вік').selectOption({ label: '55+' });
  await expect(list.getByRole('link')).toHaveCount(1);
  await expect(list).toContainText('Йога 55+');

  await page.getByLabel('Вік').selectOption({ label: 'Будь-який' });
  await page.getByLabel('Рівень').selectOption({ label: 'Просунутий' });
  await expect(list.getByRole('link')).toHaveCount(1);
  await expect(list).toContainText('Аштанга');
});

test('catalog search and halls tab', async ({ page }) => {
  await page.goto('/catalog');
  await page.getByLabel('Пошук').fill('бокс');
  await page.getByLabel('Пошук').press('Enter');
  await expect(page.getByTestId('section-list').getByRole('link')).toHaveCount(2);

  await page.getByRole('tab', { name: 'Оренда залів' }).click();
  await expect(page.getByTestId('hall-list').getByRole('link')).toHaveCount(7);
  await page.getByLabel('Центр').selectOption({ label: 'Арена Сихів' });
  await expect(page.getByTestId('hall-list').getByRole('link')).toHaveCount(2);
});

test('network tree shows centers, halls and sections', async ({ page }) => {
  await page.goto('/network');
  const tree = page.getByTestId('network-tree');
  await expect(tree).toContainText('Мережа спортивних центрів');
  await expect(tree).toContainText('Арена Центр');
  await expect(tree).toContainText('Басейн 25 м');
  await expect(tree).toContainText('Плавання для дітей');
  await tree.getByRole('link', { name: 'Зал йоги' }).click();
  await expect(page.getByRole('heading', { name: 'Зал йоги' })).toBeVisible();
});

test('trainers page links to filtered sections', async ({ page }) => {
  await page.goto('/trainers');
  await expect(page.getByRole('heading', { name: 'Олена Мороз' })).toBeVisible();
  await page.locator('.card', { hasText: 'Олена Мороз' }).getByRole('link', { name: 'Секції' }).click();
  await expect(page.getByTestId('section-list').getByRole('link')).toHaveCount(3);
});

test('guest is asked to log in before booking', async ({ page }) => {
  await page.goto('/catalog');
  await page.getByTestId('section-list').getByRole('link', { name: /Пілатес/ }).click();
  await page.getByTestId('sessions').getByRole('button').first().click();
  await expect(page.getByRole('link', { name: 'увійдіть' })).toBeVisible();
});
