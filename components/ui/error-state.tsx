import { RefreshCw } from "lucide-react";

type ErrorStateProps = {
  title: string;
  message: string;
  onRetry: () => void;
  className?: string;
};

export function ErrorState({
  title,
  message,
  onRetry,
  className = "",
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={`flex min-h-72 w-full flex-col items-center justify-center rounded-lg border border-[#d9e1ec] bg-white p-8 text-center ${className}`}
    >
      <RefreshCw className="text-[#2463eb]" aria-hidden="true" />
      <h2 className="mt-4 text-xl font-extrabold">{title}</h2>
      <p className="mt-2 max-w-md text-sm text-[#526071]">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-5 rounded-lg bg-[#2463eb] px-5 py-2.5 text-sm font-semibold text-white"
      >
        Повторить
      </button>
    </div>
  );
}
