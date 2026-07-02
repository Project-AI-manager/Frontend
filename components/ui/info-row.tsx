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
      className={`flex justify-between gap-4 border-b pb-3 last:border-0 ${
        inverted ? "border-white/10" : "border-[#d9e1ec]"
      }`}
    >
      <span className={inverted ? "text-white/45" : "text-neutral-500"}>
        {label}
      </span>
      <span
        className={`${truncate ? "min-w-0 truncate" : ""} text-right font-bold`}
      >
        {value}
      </span>
    </div>
  );
}
