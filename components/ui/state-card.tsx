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

  if (align === "center") {
    return (
      <div
        className={`rounded-lg border p-5 text-center ${toneClass} ${className}`}
      >
        <div className="mx-auto flex size-10 items-center justify-center rounded-lg bg-white shadow-sm">
          {icon}
        </div>
        <p className="mt-3 font-black">{title}</p>
        {description ? (
          <p className="mt-2 text-sm leading-6 opacity-75">{description}</p>
        ) : null}
      </div>
    );
  }

  return (
    <div className={`rounded-lg border p-5 ${toneClass} ${className}`}>
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm">
          {icon}
        </span>
        <div>
          <p className="font-black">{title}</p>
          {description ? (
            <p className="mt-1 text-sm leading-6 opacity-75">{description}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
