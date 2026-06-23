import { Card, PublicHeader } from "@/components/navigation";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-bg">
      <PublicHeader />
      <main className="mx-auto max-w-4xl px-6 py-12">
        <Card>
          <h1 className="font-display text-4xl font-black">Политика конфиденциальности</h1>
          <p className="mt-4 text-ink/65">
            Черновик для MVP. Финальную редакцию должен проверить юрист перед запуском пилотов и обработкой персональных данных.
          </p>
          <div className="mt-8 space-y-5 text-sm leading-7 text-ink/70">
            <p>
              Сервис обрабатывает данные пользователей кабинета и сообщения клиентов компаний, необходимые для работы единого окна,
              базы знаний, AI-ответов и эскалаций менеджерам.
            </p>
            <p>
              Данные используются для предоставления сервиса, авторизации, поддержки, аналитики качества ответов и соблюдения лимитов тарифа.
            </p>
            <p>
              В MVP предполагается хранение данных в инфраструктуре РФ. Клиент может запросить удаление данных рабочего пространства.
            </p>
          </div>
        </Card>
      </main>
    </div>
  );
}
