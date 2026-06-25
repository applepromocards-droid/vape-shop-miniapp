# Vape Shop — Telegram Mini App (стартовый шаблон)

Стартовый каркас мини-приложения Telegram для каталога и заказа.
Стек: **React + Vite + TypeScript**, без бэкенда (заказ уходит боту через `sendData`).

## Что уже есть
- Каталог категорий сеткой 2×N (как на референсе)
- Переход внутрь категории → список товаров
- Корзина с количеством и подсчётом суммы
- Оформление заказа через `Telegram.WebApp.sendData` + `MainButton`
- Нижняя навигация: Каталог / Избранное / Корзина / Профиль
- Экран **подтверждения возраста (18+)** — обязателен для никотиновой продукции
- Чтение профиля пользователя из `initDataUnsafe`
- Тёмная тема, подхват `themeParams` Telegram

## Запуск
```bash
npm install
npm run dev
```
Открой по адресу из консоли. Вне Telegram часть фич (MainButton, профиль) работает в режиме заглушки.

## Тест внутри Telegram
1. Создай бота у [@BotFather](https://t.me/BotFather), включи Mini App.
2. Подними публичный HTTPS (для dev — `ngrok http 5173` или Cloudflare Tunnel).
3. Укажи URL приложения в настройках бота / кнопке меню.

## Деплой
```bash
npm run build   # соберёт статику в dist/
```
`dist/` залей на любой статик-хостинг по HTTPS (Vercel, Netlify, Cloudflare Pages, свой nginx).

## Куда дальше (для Claude Code)
- `src/data/catalog.ts` — замени мок-данные на свой источник (API / Google Sheets / БД).
- Картинки категорий/товаров (`image`) — поставь свои реальные ссылки.
- `src/pages/Cart.tsx` — `checkout()` шлёт JSON боту. На стороне бота прими `web_app_data`,
  **обязательно проверь подпись `initData`** (HMAC по токену бота) и создай заказ.
- `Favorites` — пустая заглушка, логику добавь по образцу `CartContext`.
- Возрастной порог: `MIN_AGE` в `src/components/AgeGate.tsx` (18 / 21).

## Важно (легал / модерация)
- Telegram и магазины приложений требуют возрастной гейт и запрет продажи несовершеннолетним.
- Возрастную проверку на проде лучше дублировать на бэкенде, не только на клиенте.
- Добавь обязательные предупреждения о вреде и юр. требования своей юрисдикции.

## Структура
```
src/
├── App.tsx              # роутинг табов + age gate
├── telegram.ts          # типы и хелперы Telegram WebApp
├── types.ts             # модели данных
├── data/catalog.ts      # МОК каталога (заменить)
├── context/CartContext  # состояние корзины
├── components/          # AgeGate, BottomNav, Header, *Card
└── pages/               # Catalog, Favorites, Cart, Profile
```
