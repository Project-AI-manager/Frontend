import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";

export default function PrivacyPage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-5 py-16 lg:px-8">
        <div className="glass-card rounded-lg p-8">
          <p className="text-sm font-black uppercase tracking-[0.22em] text-[#2463eb]">
            Документы
          </p>
          <h1 className="mt-4 text-4xl font-black tracking-tight">
            Политика конфиденциальности
          </h1>
          <p className="mt-5 leading-7 text-neutral-600">
            Это черновая страница для MVP. Здесь будет описание того, какие
            данные пользователей, компаний, клиентов и сообщений хранит сервис,
            как используются токены авторизации и какие права есть у владельца
            аккаунта.
          </p>
          <div className="mt-8 space-y-4 text-sm leading-7 text-neutral-600">
            <p>
              На этапе разработки сервис использует тестовые данные, mock
              AI-провайдера и локальные окружения. Production-политика будет
              оформлена перед публичным запуском.
            </p>
            <p>
              Для интеграций с Telegram и другими каналами потребуется отдельное
              описание обработки внешних идентификаторов и сообщений клиентов.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
