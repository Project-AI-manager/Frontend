import { LoadingState } from "@/components/ui/loading-state";

export default function Loading() {
  return (
    <main className="min-h-screen bg-[#f4f7fb]">
      <LoadingState
        label="Открываем раздел…"
        className="min-h-screen rounded-none border-0 bg-transparent"
      />
    </main>
  );
}
