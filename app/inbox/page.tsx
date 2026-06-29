import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export default function InboxPage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-6xl px-6 py-12">
        <h1 className="text-2xl font-bold">Диалоги</h1>
        {/* TODO: список диалогов · тред · контекст */}
      </main>
      <Footer />
    </>
  );
}
