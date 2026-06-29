import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";

export default function TermsPage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-5 py-16 lg:px-8">
        <div className="glass-card rounded-[2rem] p-8">
          <p className="text-sm font-black uppercase tracking-[0.22em] text-orange-600">
            Документы
          </p>
          <h1 className="mt-4 text-4xl font-black tracking-tight">Условия использования</h1>
          <p className="mt-5 leading-7 text-neutral-600">
            Это MVP-заготовка условий. Здесь будут правила использования кабинета, AI-черновиков,
            базы знаний, каналов связи и ограничений тарифа.
          </p>
          <div className="mt-8 space-y-4 text-sm leading-7 text-neutral-600">
            <p>
              AI-ответы на текущем этапе считаются подсказками для менеджера. Пользователь отвечает
              за проверку фактов, источников и финального текста перед отправкой клиенту.
            </p>
            <p>
              Автоматическая отправка ответов должна включаться только после настройки порога
              уверенности, базы знаний и правил эскалации.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
