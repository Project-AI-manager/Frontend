import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export default function OnboardingPage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-2xl font-bold">Онбординг</h1>
        {/* TODO: 3 шага — профиль → канал → первый документ */}
      </main>
      <Footer />
    </>
  );
}
