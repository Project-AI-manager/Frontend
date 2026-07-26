import { AppShell } from "@/components/layout/app-shell";

type Block = { title: string; text: string };

export function PageTemplate({ title, description, blocks }: { title: string; description: string; blocks: Block[] }) {
  return (
    <AppShell title={title} description={description}>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {blocks.map((block) => (
          <section key={block.title} className="wire-panel min-h-44 p-5">
            <div className="mb-8 h-3 w-20 bg-[var(--soft)]" />
            <h2 className="text-lg font-bold">{block.title}</h2>
            <p className="mt-2 text-sm leading-6 wire-muted">{block.text}</p>
          </section>
        ))}
      </div>
    </AppShell>
  );
}
