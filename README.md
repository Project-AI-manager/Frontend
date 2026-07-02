# Frontend — AI-сотрудник в едином окне

Next.js + TypeScript frontend для SaaS-платформы «Едино».

## Реализованные маршруты MVP

- `/` — лендинг с секциями возможностей, демо и тарифов.
- `/login`, `/register` — регистрация и вход через backend API с JWT-сессией.
- `/onboarding` — первый запуск: компания → веб-чат → база знаний.
- `/inbox` — единое окно диалогов.
- `/knowledge` — документы, playground RAG и кандидаты автообучения.
- `/analytics` — базовые KPI.
- `/channels` — подключение каналов и код веб-чата.
- `/settings` — AI, команда, тариф, компания.
- `/profile` — личный профиль.
- `/legal/privacy`, `/legal/terms` — черновики юридических страниц.

Тарифы и «о проекте» не вынесены в отдельные страницы: они находятся секциями на лендинге, чтобы MVP не раздувался.

## Запуск

```bash
npm install
npm run dev
```

## Проверки

```bash
npm run lint
npm test
npm run build
```

## QA checklist

- `/login` и `/register`: успешный вход/регистрация, локализованная ошибка backend, переход в кабинет.
- `/profile`: кнопка выхода очищает токены, query-cache и возвращает на `/login`.
- Истёкшая сессия: после неудачного refresh пользователь возвращается на `/login`.
- `/channels`: Telegram form показывает успешное подключение и ошибки backend.
- `/analytics`, `/knowledge`, `/settings`: loading/error/empty states видны и не ломают layout.
- Mobile widths 375px/768px: формы, карточки и таблицы не выходят за экран.

После входа или регистрации frontend сохраняет access/refresh tokens, автоматически
обновляет access token при `401` и защищает маршруты кабинета через session-cookie.
Кнопка выхода очищает токены и возвращает пользователя на `/login`.
