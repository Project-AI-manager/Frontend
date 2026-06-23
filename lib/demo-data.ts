export const workspaceName = "ООО «Север»";

export const channels = [
  { name: "Веб-чат", type: "web", status: "Активен", dialogs: 312 },
  { name: "Avito", type: "avito", status: "Активен", dialogs: 684 },
  { name: "ВКонтакте", type: "vk", status: "Требует настройки", dialogs: 244 },
  { name: "MAX", type: "max", status: "Позже", dialogs: 0 },
];

export const conversations = [
  {
    id: "1",
    customer: "Иван П.",
    channel: "Avito",
    status: "Авто",
    time: "12:48",
    unread: 0,
    preview: "iPhone 15 128ГБ есть в наличии?",
    confidence: 94,
    messages: [
      "Здравствуйте! iPhone 15 128ГБ есть в наличии?",
      "Да, в наличии 2 шт: чёрный и синий. Цена 79 990 ₽, доставка по Казани сегодня.",
    ],
  },
  {
    id: "2",
    customer: "Мария",
    channel: "Веб-чат",
    status: "Нужен менеджер",
    time: "12:36",
    unread: 2,
    preview: "Можно рассрочку на 6 месяцев без переплаты?",
    confidence: 52,
    messages: [
      "Можно рассрочку на 6 месяцев без переплаты?",
      "Я нашёл условия рассрочки, но не уверен в актуальности акции. Лучше проверить менеджеру.",
    ],
  },
  {
    id: "3",
    customer: "Алексей",
    channel: "VK",
    status: "Закрыто",
    time: "11:59",
    unread: 0,
    preview: "Спасибо, заберу самовывозом сегодня.",
    confidence: 88,
    messages: [
      "Где можно забрать заказ?",
      "Самовывоз доступен сегодня до 20:00: Казань, ул. Петербургская, 42.",
    ],
  },
];

export const documents = [
  { title: "Прайс-лист 2026.pdf", type: "PDF", status: "Готов", chunks: 84, updated: "2026-06-21" },
  { title: "Условия доставки", type: "Manual", status: "Готов", chunks: 17, updated: "2026-06-21" },
  { title: "FAQ по возвратам.docx", type: "DOCX", status: "Обрабатывается", chunks: 0, updated: "2026-06-23" },
];

export const candidates = [
  {
    question: "Можно ли оплатить при получении?",
    answer: "Да, при самовывозе можно оплатить картой или наличными. При доставке — онлайн до отправки.",
  },
  {
    question: "Сколько гарантия на восстановленные устройства?",
    answer: "Гарантия на восстановленные устройства — 90 дней с даты покупки.",
  },
];

export const metrics = [
  { label: "Доля автоответов", value: "78%", hint: "+12% за неделю" },
  { label: "Среднее время ответа", value: "12 сек", hint: "было 4 мин 20 сек" },
  { label: "Диалогов в месяце", value: "1 240 / 2 000", hint: "62% лимита" },
  { label: "Новых знаний", value: "+34", hint: "из ответов менеджеров" },
];
