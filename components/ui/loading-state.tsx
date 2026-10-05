import { LoaderCircle } from "lucide-react";

type LoadingStateProps = {
  label: string;
  className?: string;
};

export function LoadingState({ label, className = "" }: LoadingStateProps) {
  return (
    <div
      role="status"
      aria-label={label}
      aria-busy="true"
      className={`flex min-h-[240px] flex-col items-center justify-center gap-3 rounded-lg border border-[#d9e1ec] bg-white px-6 py-10 text-center ${className}`}
    >
      <span className="grid size-12 place-items-center rounded-full bg-[#eef4ff] text-[#2463eb]">
        <LoaderCircle size={26} strokeWidth={2} className="animate-spin motion-reduce:animate-none" aria-hidden="true" />
      </span>
      <span className="text-sm font-semibold text-[#526071]">{label}</span>
    </div>
  );
}
