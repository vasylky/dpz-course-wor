import { expect, type Page } from '@playwright/test';

export const GOOD_CARD = '4242 4242 4242 4242';
export const DECLINED_CARD = '4000 0000 0000 0002';

export async function registerUser(page: Page, name = 'Тест Користувач') {
  const email = `e2e_${Date.now()}_${Math.floor(Math.random() * 1e6)}@test.local`;
  await page.goto('/register');
  await page.getByLabel('ПІБ').fill(name);
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Телефон').fill('+380501234567');
  await page.getByLabel('Пароль').fill('secret123');
  await page.getByRole('button', { name: 'Створити акаунт' }).click();
  await expect(page.getByRole('heading', { name: 'Особистий кабінет' })).toBeVisible();
  return email;
}

export async function login(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Пароль').fill(password);
  await page.getByRole('button', { name: 'Увійти' }).click();
  await expect(page.getByRole('button', { name: 'Вийти' })).toBeVisible();
}

export async function openSection(page: Page, name: string) {
  await page.goto('/catalog');
  await page.getByTestId('section-list').getByRole('link', { name: new RegExp(name) }).click();
  await expect(page.getByRole('heading', { level: 1, name })).toBeVisible();
}

export async function pickFirstSession(page: Page, index = 0) {
  await page.getByTestId('sessions').getByRole('button').filter({ hasText: 'вільно' }).nth(index).click();
  await expect(page.getByTestId('price-total')).toBeVisible();
}

export async function payWith(page: Page, card: string) {
  await page.getByLabel('Номер картки').fill(card);
  await page.getByRole('button', { name: /Сплатити/ }).click();
}
