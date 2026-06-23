import { Card, PublicHeader } from "@/components/navigation";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-bg">
      <PublicHeader />
      <main className="mx-auto max-w-4xl px-6 py-12">
        <Card>
          <h1 className="font-display text-4xl font-black">Условия использования</h1>
          <p className="mt-4 text-ink/65">
            Черновик оферты для демонстрационного MVP. Для коммерческого запуска потребуется юридическая версия.
          </p>
          <div className="mt-8 space-y-5 text-sm leading-7 text-ink/70">
            <p>
              «Едино» предоставляет компаниям кабинет для обработки обращений, подключения каналов, ведения базы знаний и генерации AI-ответов.
            </p>
            <p>
              Пользователь отвечает за корректность загружаемой базы знаний, подключённых каналов и соблюдение прав третьих лиц.
            </p>
            <p>
              AI-ответы в MVP следует использовать под контролем менеджера, особенно для условий оплаты, возвратов и юридически значимых обещаний.
            </p>
          </div>
        </Card>
      </main>
    </div>
  );
}
