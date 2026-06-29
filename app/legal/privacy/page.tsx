import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export default function PrivacyPage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-2xl font-bold">Политика конфиденциальности</h1>
        {/* TODO: текст (152-ФЗ) */}
      </main>
      <Footer />
    </>
  );
}
