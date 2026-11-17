import { expect, test } from '@playwright/test';
import { DECLINED_CARD, GOOD_CARD, login, openSection, payWith, pickFirstSession, registerUser } from './helpers';

test('book a section, declined card, then successful payment and bonuses', async ({ page }) => {
  await registerUser(page);
  await openSection(page, 'Хатха-йога ранок');
  await pickFirstSession(page);
  await expect(page.getByTestId('price-total')).toHaveText(/220/);
  await page.getByRole('button', { name: 'Забронювати' }).click();

  await expect(page.getByTestId('booking-status')).toHaveText('Очікує оплати');
  await payWith(page, DECLINED_CARD);
  await expect(page.getByRole('alert')).toHaveText('Недостатньо коштів на картці');
  await expect(page.getByTestId('booking-status')).toHaveText('Очікує оплати');

  await payWith(page, GOOD_CARD);
  await expect(page.getByTestId('booking-status')).toHaveText('Підтверджено');
  await expect(page.getByText('Нараховано бонусів: 11')).toBeVisible();

  await page.goto('/cabinet?tab=loyalty');
  await expect(page.getByTestId('bonus-points')).toHaveText('11');

  await page.goto('/cabinet?tab=notifications');
  const n = page.getByTestId('notifications');
  await expect(n).toContainText('підтверджено');
  await expect(n).toContainText('Нараховано 11 бонусних балів');

  await page.goto('/cabinet');
  await expect(page.getByTestId('bookings-table')).toContainText('Хатха-йога ранок');
});

test('cannot book the same session twice', async ({ page }) => {
  await registerUser(page);
  await openSection(page, 'Аштанга');
  await pickFirstSession(page);
  await page.getByRole('button', { name: 'Забронювати' }).click();
  await expect(page.getByTestId('booking-status')).toHaveText('Очікує оплати');
  await openSection(page, 'Аштанга');
  await page.getByTestId('sessions').getByRole('button').first().click();
  await expect(page.getByRole('alert')).toHaveText('Ви вже записані на це заняття');
});

test('cancel paid booking refunds and returns bonus', async ({ page }) => {
  await registerUser(page);
  await openSection(page, 'Функціональний тренінг');
  await pickFirstSession(page, 1);
  await page.getByRole('button', { name: 'Забронювати' }).click();
  await payWith(page, GOOD_CARD);
  await expect(page.getByTestId('booking-status')).toHaveText('Підтверджено');

  page.once('dialog', (d) => d.accept());
  await page.getByRole('button', { name: 'Скасувати бронювання' }).click();
  await expect(page.getByTestId('booking-status')).toHaveText('Скасовано');

  await page.goto('/cabinet?tab=loyalty');
  await expect(page.getByTestId('bonus-points')).toHaveText('0');
  await page.goto('/cabinet?tab=notifications');
  await expect(page.getByTestId('notifications')).toContainText('Кошти 200 грн повернуто на картку');
});

test('hall rental with evening surcharge', async ({ page }) => {
  await registerUser(page);
  await page.goto('/catalog?tab=halls');
  await page.getByTestId('hall-list').getByRole('link', { name: /Футбольний манеж/ }).click();
  const day = new Date(Date.now() + (3 + Math.floor(Math.random() * 15)) * 86400_000).toISOString().slice(0, 10);
  await page.getByLabel('Дата').fill(day);
  await page.getByLabel('Тривалість').selectOption('2');
  const evening = page.locator('[data-testid=hours] button:not([disabled])', { hasText: /^(18|19|20):00$/ }).first();
  await expect(evening).toBeVisible();
  const label = await evening.innerText();
  await evening.click();
  const panel = page.getByTestId('booking-panel');
  await expect(panel).toContainText('Вечірній час (+20%)');
  await expect(page.getByTestId('price-total')).toHaveText(/2\s?880/);
  await page.getByRole('button', { name: 'Забронювати' }).click();
  await payWith(page, GOOD_CARD);
  await expect(page.getByTestId('booking-status')).toHaveText('Підтверджено');

  await page.goto('/catalog?tab=halls');
  await page.getByTestId('hall-list').getByRole('link', { name: /Футбольний манеж/ }).click();
  await page.getByLabel('Дата').fill(day);
  await expect(page.getByTestId('hours').getByRole('button', { name: label })).toBeDisabled();
});

test('monthly membership covers section booking', async ({ page }) => {
  await registerUser(page);
  await page.goto('/cabinet?tab=memberships');
  await page.locator('.plan', { hasText: 'Місячний' }).getByRole('button', { name: 'Обрати' }).click();
  await payWith(page, GOOD_CARD);
  await expect(page.getByText('Абонемент "Місячний" придбано')).toBeVisible();
  await expect(page.getByTestId('memberships-table')).toContainText('безлімітно');

  await openSection(page, 'Бокс спаринги');
  await pickFirstSession(page);
  await expect(page.getByTestId('booking-panel')).toContainText('Абонемент: Місячний');
  await expect(page.getByTestId('price-total')).toHaveText(/^0/);
  await page.getByRole('button', { name: 'Забронювати' }).click();
  await expect(page.getByTestId('booking-status')).toHaveText('Підтверджено');
});

test('premium card gives free pool and discount elsewhere', async ({ page }) => {
  await login(page, 'premium@sport.local', 'premium123');
  await openSection(page, 'Плавання: техніка кролю');
  await pickFirstSession(page);
  await expect(page.getByTestId('booking-panel')).toContainText('Картка Преміум: безкоштовно');
  await expect(page.getByTestId('price-total')).toHaveText(/^0/);

  await openSection(page, 'Пілатес');
  await pickFirstSession(page);
  await expect(page.getByTestId('booking-panel')).toContainText('Картка Преміум (-10%)');
  await expect(page.getByTestId('price-total')).toHaveText(/189/);
});

test('bonus points can pay up to half of the price', async ({ page }) => {
  await login(page, 'user@sport.local', 'user123');
  await openSection(page, 'Футбол аматори');
  await pickFirstSession(page);
  await page.getByLabel(/Списати бонуси/).check();
  await expect(page.getByTestId('booking-panel')).toContainText('Бонусні бали');
  await expect(page.getByTestId('price-total')).not.toHaveText(/^250/);
});

test('upgrade to premium card', async ({ page }) => {
  await registerUser(page);
  await page.goto('/cabinet?tab=loyalty');
  await expect(page.getByTestId('loyalty-card')).toContainText('Стандартна');
  await page.locator('.plan', { hasText: 'Преміум' }).getByRole('button', { name: 'Оформити' }).click();
  await payWith(page, GOOD_CARD);
  await expect(page.getByTestId('loyalty-card')).toContainText('Преміум');
  await expect(page.getByTestId('loyalty-card')).toContainText('Безкоштовний доступ до басейну');
});
