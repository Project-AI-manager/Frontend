import type { ReactNode } from "react";

type InfoRowProps = {
  label: string;
  value: ReactNode;
  inverted?: boolean;
  truncate?: boolean;
};

/**
 * Строка «подпись → значение» для сводок и карточек.
 * Подпись — приглушённый текст, значение — плотный Manrope справа.
 */
export function InfoRow({
  label,
  value,
  inverted = false,
  truncate = false,
}: InfoRowProps) {
  // Подсказка нужна только тогда, когда значение действительно обрезается
  // и его можно показать текстом.
  const title = truncate && typeof value === "string" ? value : undefined;

  return (
    <div
      className={`grid grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)] items-baseline gap-4 border-b py-3 first:pt-0 last:border-0 last:pb-0 ${
        inverted ? "border-white/10" : "border-line"
      }`}
    >
      <span className={`text-sm ${inverted ? "text-white/60" : "text-muted"}`}>
        {label}
      </span>
      <span
        title={title}
        className={`${truncate ? "min-w-0 truncate" : ""} text-right font-display text-sm font-bold tracking-[-0.01em] ${
          inverted ? "text-white" : "text-ink"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
