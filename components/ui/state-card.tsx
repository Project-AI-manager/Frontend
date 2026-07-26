import type { ReactNode } from "react";

export type StateCardVariant = "empty" | "error" | "loading";
export type StateCardTone = "neutral" | "error";
export type StateCardAlign = "start" | "center";

/** Ширины строк-скелетонов: имитируют заголовок и пару строк текста. */
const SKELETON_WIDTHS = ["w-2/5", "w-full", "w-4/5", "w-3/5"];

export type StateCardProps = {
  /** Иконка состояния. В варианте loading не показывается. */
  icon?: ReactNode;
  title: string;
  description?: string;
  /**
   * empty — пустой список (по умолчанию), error — ошибка,
   * loading — скелетоны вместо иконки и текста.
   */
  variant?: StateCardVariant;
  /** Оформление. Не задан — выводится из variant. */
  tone?: StateCardTone;
  align?: StateCardAlign;
  /** Сколько строк-скелетонов рисовать при variant="loading". */
  rows?: number;
  className?: string;
  /** Необязательное действие: кнопка или ссылка с классами .wf-btn. */
  action?: ReactNode;
};

/**
 * Единая карточка состояния экрана: загрузка, пустой список, ошибка.
 * В каркасе все тона монохромные — ошибка отличается не цветом, а ролью
 * alert и aria-live="assertive". Заголовок всегда h3, загрузка всегда
 * .wf-skeleton, чтобы шесть экранов кабинета показывали состояния одинаково.
 */
export function StateCard({
  icon,
  title,
  description,
  variant = "empty",
  tone,
  align = "start",
  rows = 3,
  className = "",
  action,
}: StateCardProps) {
  const isLoading = variant === "loading";
  const resolvedTone: StateCardTone =
    tone ?? (variant === "error" ? "error" : "neutral");
  const isError = !isLoading && resolvedTone === "error";
  const isCentered = align === "center";

  const headingClass = `text-base font-semibold ${
    isCentered ? "text-balance" : ""
  }`;

  const actionClass = `mt-4 ${isCentered ? "flex justify-center" : ""}`;
  const rowCount = Math.max(1, Math.round(rows));

  return (
    <section
      role={isError ? "alert" : "status"}
      aria-live={isError ? "assertive" : "polite"}
      aria-busy={isLoading ? true : undefined}
      data-tone={resolvedTone}
      className={`wf-fill p-5 sm:p-6 ${
        isCentered ? "text-center" : ""
      } ${className}`}
    >
      {isLoading ? (
        <>
          {/* Скринридер получает текст состояния, глазами его заменяют скелетоны. */}
          <h3 className={`sr-only ${headingClass}`}>{title}</h3>
          {description ? <p className="sr-only">{description}</p> : null}
          <div className="space-y-3" aria-hidden="true">
            {Array.from({ length: rowCount }, (_, index) => (
              <span
                key={index}
                className={`wf-skeleton block ${index === 0 ? "h-4" : "h-3"} ${
                  SKELETON_WIDTHS[index % SKELETON_WIDTHS.length]
                } ${isCentered ? "mx-auto" : ""}`}
              />
            ))}
          </div>
          {action ? <div className={actionClass}>{action}</div> : null}
        </>
      ) : (
        <div
          className={
            isCentered ? "flex flex-col items-center" : "flex items-start gap-4"
          }
        >
          {icon ? (
            <span className="wf-muted shrink-0" aria-hidden="true">
              {icon}
            </span>
          ) : null}
          <div
            className={`min-w-0 ${isCentered ? "" : "flex-1"} ${
              isCentered && icon ? "mt-3" : ""
            }`}
          >
            <h3 className={headingClass}>{title}</h3>
            {description ? (
              <p
                className={`wf-muted mt-2 text-sm leading-6 ${
                  isCentered ? "mx-auto max-w-sm" : ""
                }`}
              >
                {description}
              </p>
            ) : null}
            {action ? <div className={actionClass}>{action}</div> : null}
          </div>
        </div>
      )}
    </section>
  );
}
