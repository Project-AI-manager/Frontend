import type { ReactNode } from "react";

type StateCardProps = {
  icon: ReactNode;
  title: string;
  description?: string;
  tone?: "neutral" | "error";
  align?: "start" | "center";
  className?: string;
};

export function StateCard({
  icon,
  title,
  description,
  tone = "neutral",
  align = "start",
  className = "",
}: StateCardProps) {
  const toneClass =
    tone === "error"
      ? "border-red-200 bg-red-50 text-red-700"
      : "border-[#d9e1ec] bg-white text-neutral-600";

  return (
    <section
      role={tone === "error" ? "alert" : "status"}
      aria-live={tone === "error" ? "assertive" : "polite"}
      className={`rounded-lg border p-5 ${
        align === "center" ? "text-center" : ""
      } ${toneClass} ${className}`}
    >
      <div
        className={
          align === "center" ? "flex flex-col items-center" : "flex items-start gap-3"
        }
      >
        <span
          className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm"
          aria-hidden="true"
        >
          {icon}
        </span>
        <div className={align === "center" ? "mt-3" : ""}>
          <h2 className="font-black">{title}</h2>
          {description ? (
            <p
              className={`${align === "center" ? "mt-2" : "mt-1"} text-sm leading-6 opacity-75`}
            >
              {description}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
