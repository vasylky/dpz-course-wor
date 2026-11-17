import path from 'path';
import { expect, test } from '@playwright/test';
import { login, registerUser } from './helpers';

test('profile edit, preferences and photo upload', async ({ page }) => {
  await registerUser(page, 'Профіль Тест');
  await page.goto('/cabinet?tab=profile');
  await page.getByLabel('Телефон').fill('+380991112233');
  await page.getByLabel('Плавання').check();
  await page.getByLabel('Нагадувати за, годин').fill('12');
  await page.getByRole('button', { name: 'Зберегти' }).click();
  await expect(page.getByText('Профіль збережено')).toBeVisible();

  await page.getByLabel('Завантажити фото').setInputFiles(path.join(__dirname, 'fixtures', 'avatar.png'));
  await expect(page.getByAltText('Фото профілю')).toBeVisible();

  await page.reload();
  await expect(page.getByLabel('Телефон')).toHaveValue('+380991112233');
  await expect(page.getByLabel('Плавання')).toBeChecked();
});

test('client cannot open admin panel', async ({ page }) => {
  await registerUser(page);
  await page.goto('/admin');
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('link', { name: 'Адмін' })).toHaveCount(0);
});

test('admin creates section and promotion, clients get notified', async ({ browser }) => {
  const userCtx = await browser.newContext();
  const userPage = await userCtx.newPage();
  await registerUser(userPage, 'Підписник');

  const adminCtx = await browser.newContext();
  const page = await adminCtx.newPage();
  await login(page, 'admin@sport.local', 'admin123');
  await expect(page.getByRole('heading', { name: 'Адміністрування' })).toBeVisible();
  await expect(page.getByText('Клієнтів')).toBeVisible();

  const name = `Кросфіт ${Date.now()}`;
  await page.getByRole('tab', { name: 'Секції' }).click();
  await page.getByRole('button', { name: 'Додати' }).click();
  const form = page.getByRole('form', { name: 'Форма: Секції' });
  await form.getByLabel('Назва').fill(name);
  await form.getByLabel('Вид спорту').selectOption({ label: 'Фітнес' });
  await form.getByLabel('Зал').selectOption({ label: 'Арена Центр: Фітнес-зал' });
  await form.getByLabel('Тренер').selectOption({ label: 'Ігор Савчук' });
  await form.getByLabel('Рівень').selectOption({ label: 'Середній' });
  await form.getByLabel('Вікова група').selectOption({ label: 'Дорослі' });
  await form.getByLabel('Місць').fill('15');
  await form.getByLabel('Ціна за заняття').fill('240');
  await form.getByLabel('Активна').check();
  await form.getByRole('button', { name: 'Створити' }).click();
  await expect(page.locator('table')).toContainText(name);

  await page.getByRole('tab', { name: 'Розклад' }).click();
  await page.getByLabel('Секція').selectOption({ label: name });
  const start = new Date(Date.now() + 3 * 86400_000);
  start.setHours(18, 0, 0, 0);
  const local = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}T18:00`;
  await page.getByLabel('Початок').fill(local);
  await page.getByLabel('Повторити тижнів').fill('3');
  await page.getByRole('button', { name: 'Додати заняття' }).click();
  await expect(page.locator('table tbody tr')).toHaveCount(3);

  const promo = `Чорна п'ятниця ${Date.now()}`;
  await page.getByRole('tab', { name: 'Акції' }).click();
  await page.getByRole('button', { name: 'Додати' }).click();
  await page.getByLabel('Заголовок').fill(promo);
  await page.getByLabel('Опис').fill('Знижка на всі абонементи');
  await page.getByRole('button', { name: 'Створити' }).click();
  await expect(page.locator('table')).toContainText(promo);

  await userPage.goto('/cabinet?tab=notifications');
  const n = userPage.getByTestId('notifications');
  await expect(n).toContainText(`Нова секція: ${name}`);
  await expect(n).toContainText(`Акція: ${promo}`);
  await expect(userPage.getByTestId('unread-count')).toBeVisible();
  await userPage.getByRole('button', { name: 'Позначити всі прочитаними' }).click();
  await expect(userPage.getByTestId('unread-count')).toHaveCount(0);

  await userPage.goto('/catalog');
  await userPage.getByLabel('Пошук').fill(name);
  await userPage.getByLabel('Пошук').press('Enter');
  await userPage.getByTestId('section-list').getByRole('link').first().click();
  await expect(userPage.getByTestId('sessions').getByRole('button')).toHaveCount(3);

  page.on('dialog', (d) => d.accept());
  await page.getByRole('tab', { name: 'Секції' }).click();
  await page.locator('tr', { hasText: name }).getByRole('button', { name: 'Видалити' }).click();
  await expect(page.locator('table')).not.toContainText(name);
  await page.getByRole('tab', { name: 'Акції' }).click();
  await page.locator('tr', { hasText: promo }).getByRole('button', { name: 'Видалити' }).click();
  await expect(page.locator('table')).not.toContainText(promo);

  await userCtx.close();
  await adminCtx.close();
});

test('admin sees bookings and changes user loyalty tier', async ({ page }) => {
  await login(page, 'admin@sport.local', 'admin123');
  await page.getByRole('tab', { name: 'Користувачі' }).click();
  const row = page.locator('tr', { hasText: 'user@sport.local' });
  await row.getByRole('button', { name: 'Редагувати' }).click();
  await page.getByLabel('Картка').selectOption({ label: 'Корпоративна' });
  await page.getByLabel('Компанія').fill('ТОВ Тест');
  await page.getByRole('button', { name: 'Зберегти' }).click();
  await expect(row).toContainText('Корпоративна');
  await row.getByRole('button', { name: 'Редагувати' }).click();
  await page.getByLabel('Картка').selectOption({ label: 'Стандартна' });
  await page.getByRole('button', { name: 'Зберегти' }).click();
  await expect(row).toContainText('Стандартна');

  await page.getByRole('tab', { name: 'Бронювання' }).click();
  await expect(page.locator('table tbody tr').first()).toBeVisible();
});
