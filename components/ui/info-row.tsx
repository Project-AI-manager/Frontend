import type { ReactNode } from "react";

type InfoRowProps = {
  label: string;
  value: ReactNode;
  /**
   * Строка на инвертированной поверхности. В каркасе поверхностей тёмного
   * тона нет, поэтому визуально ничего не меняет — prop сохранён, чтобы не
   * ломать вызовы и вернуться к нему вместе с визуальным стилем.
   */
  inverted?: boolean;
  truncate?: boolean;
};

/**
 * Строка «подпись → значение» для сводок и карточек.
 * Подпись слева приглушённая, значение прижато вправо,
 * между строками — тонкий разделитель (у первой строки его нет).
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
    <div className="group" data-inverted={inverted ? "true" : undefined}>
      <div className="wf-divider group-first:hidden" />
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)] items-baseline gap-4 py-3 group-first:pt-0 group-last:pb-0">
        <span className="wf-muted text-sm">{label}</span>
        <span
          title={title}
          className={`${truncate ? "min-w-0 truncate" : ""} text-right text-sm font-medium`}
        >
          {value}
        </span>
      </div>
    </div>
  );
}
