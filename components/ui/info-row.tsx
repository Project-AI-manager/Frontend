type InfoRowProps = {
  label: string;
  value: string;
  inverted?: boolean;
  truncate?: boolean;
};

export function InfoRow({
  label,
  value,
  inverted = false,
  truncate = false,
}: InfoRowProps) {
  return (
    <div
      className={`grid grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)] items-baseline gap-4 border-b py-3 first:pt-0 last:border-0 last:pb-0 ${
        inverted ? "border-white/10" : "border-[#d9e1ec]"
      }`}
    >
      <span
        className={`text-sm ${inverted ? "text-white/60" : "text-[#667085]"}`}
      >
        {label}
      </span>
      <span
        title={truncate ? value : undefined}
        className={`${truncate ? "min-w-0 truncate" : ""} text-right text-sm font-bold`}
      >
        {value}
      </span>
    </div>
  );
}
