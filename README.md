# Frontend — AI-сотрудник в едином окне

Next.js + TypeScript frontend для SaaS-платформы «Едино».

## Реализованные маршруты MVP

- `/` — лендинг с секциями возможностей, демо и тарифов.
- `/login`, `/register` — демо-auth до подключения настоящего backend auth.
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

Для демо-входа кнопки на `/login` и `/register` ставят cookie `refresh_token=demo`, чтобы пройти middleware до реализации настоящих JWT/cookie из backend.
