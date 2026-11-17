# Арена: бронювання спортивних залів і секцій

Курсова робота з дисципліни «Документування програмного забезпечення та шаблони проектування», варіант 1.

Веб-застосунок мережі спортивних центрів: каталог секцій і залів, онлайн-бронювання з оплатою, особистий кабінет, абонементи, картки лояльності з бонусами, сповіщення, адмін-панель.

## Стек

| Частина | Технології |
|---|---|
| Backend | NestJS 11, TypeScript, TypeORM, PostgreSQL 16, JWT (passport), class-validator, @nestjs/schedule |
| Frontend | React 19, Vite, React Router |
| Інфраструктура | Docker, Docker Compose |
| Тести | Jest (unit), Playwright (e2e) |

## Запуск

Потрібні Docker і Docker Compose.

```bash
docker compose up -d --build
```

Застосунок: http://localhost:3000 (лендінг), каталог: http://localhost:3000/catalog, API: http://localhost:3000/api. Під час першого запуску база заповнюється демо-даними.

| Роль | Email | Пароль |
|---|---|---|
| Адміністратор | admin@sport.local | admin123 |
| Клієнт (стандартна картка, 120 бонусів) | user@sport.local | user123 |
| Клієнт (преміум картка) | premium@sport.local | premium123 |

Тестові картки: `4242 4242 4242 4242` проходить, `4000 0000 0000 0002` відхиляється.

Скинути базу: `docker compose down -v`.

### Локальна розробка

```bash
docker compose up -d db
cd api && npm i && npm run start:dev     # http://localhost:3000/api
cd web && npm i && npm run dev           # http://localhost:5173
```

### Тести

```bash
cd api && npx jest                       # unit
cd e2e && npm i && npx playwright install chromium && npx playwright test   # e2e, застосунок має бути запущений
```

## Структура

```
api/src
  auth/            реєстрація, логін, JWT
  users/           профіль, фото, історія платежів
  catalog/         види спорту, центри, зали, тренери, секції, розклад
  bookings/        бронювання: фасад, стани, ціноутворення, планувальник
  payments/        платежі, адаптер платіжного шлюзу
  loyalty/         картки лояльності, бонуси
  memberships/     абонементи
  notifications/   сповіщення, шаблони повідомлень
  promotions/      акції
  admin/           CRUD і статистика для адміністратора
  common/events/   доменні події
  seed/            демо-дані
web/src
  pages/           лендінг, каталог, секція, зал, бронювання, кабінет, адмінка
  public/img/      фото (Unsplash, вільна ліцензія)
  components/      панель бронювання, форма картки, спільні елементи
e2e/tests          Playwright сценарії
docs/              UML-діаграми
```

## Шаблони проектування (GoF)

| Патерн | Де | Навіщо |
|---|---|---|
| Strategy | `loyalty/strategies/loyalty-strategy.ts` | правила знижок і бонусів для стандартної, преміум і корпоративної картки |
| Decorator | `bookings/pricing/price-component.ts` | ціна збирається шарами: база, вечірній тариф, абонемент, картка, бонуси |
| State | `bookings/state/booking-state.ts` | дозволені дії залежать від статусу бронювання |
| Facade | `bookings/booking.facade.ts` | одна точка входу для бронювання, оплати і скасування |
| Observer | `common/events/event-publisher.ts`, `loyalty.service.ts`, `notifications.service.ts` | події бронювання запускають нарахування бонусів і сповіщення |
| Factory Method | `memberships/factories/membership-factory.ts` | створення разового, місячного і корпоративного абонемента |
| Adapter | `payments/gateway/fake-bank.adapter.ts` | стороннє SDK банку приводиться до інтерфейсу `PaymentGateway` |
| Builder | `catalog/section-query.builder.ts` | покрокова побудова запиту каталогу з фільтрами |
| Composite | `catalog/composite/catalog-node.ts` | дерево мережа → центр → зал → секція з однаковими агрегатами |
| Template Method | `notifications/templates/notification-template.ts` | спільна структура повідомлення, змінні кроки у підкласах |
| Singleton | провайдери NestJS (`DomainEventPublisher`) | один екземпляр сервісу на застосунок через DI |

## Основні сценарії

1. Каталог: фільтри за видом спорту, центром, рівнем, віком, пошук.
2. Бронювання місця на занятті секції або оренда залу на 1–3 години.
3. Розрахунок ціни з деталізацією, списання бонусів (до 50%), використання абонемента.
4. Оплата карткою, підтвердження, скасування з поверненням коштів (не пізніше ніж за 2 години).
5. Неоплачені бронювання скасовуються через 30 хвилин, завершені переходять у статус «Завершено».
6. Кабінет: історія бронювань, профіль і фото, вподобання, абонементи, картка лояльності, сповіщення.
7. Сповіщення: створення і підтвердження бронювання, нагадування перед тренуванням, нарахування бонусів, нові секції (з урахуванням улюблених видів спорту), акції.
8. Адмін-панель: центри, зали, види спорту, тренери, секції, розклад, акції, користувачі, бронювання, статистика.

## REST API (основне)

| Метод | Шлях | Опис |
|---|---|---|
| POST | /api/auth/register, /api/auth/login | реєстрація, вхід |
| GET | /api/catalog/sections?sport&level&ageGroup&centerId&q | каталог секцій |
| GET | /api/catalog/sections/:id | секція з розкладом і вільними місцями |
| GET | /api/catalog/halls/:id/availability?date | вільні години залу |
| GET | /api/catalog/structure | дерево мережі |
| POST | /api/bookings/quote | розрахунок ціни |
| POST | /api/bookings | створити бронювання |
| POST | /api/bookings/:id/pay, /api/bookings/:id/cancel | оплата, скасування |
| GET | /api/bookings/me | мої бронювання |
| GET/POST | /api/memberships/plans, /api/memberships | абонементи |
| GET/POST | /api/loyalty/me, /api/loyalty/upgrade | картка лояльності |
| GET/POST | /api/notifications, /api/notifications/read-all | сповіщення |
| GET/PATCH | /api/users/me, POST /api/users/me/photo | профіль |
| * | /api/admin/* | адміністрування (роль admin) |
