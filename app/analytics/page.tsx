import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export default function AnalyticsPage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-6xl px-6 py-12">
        <h1 className="text-2xl font-bold">Аналитика</h1>
        {/* TODO: KPI · график · топ тем эскалаций */}
      </main>
      <Footer />
    </>
  );
}
