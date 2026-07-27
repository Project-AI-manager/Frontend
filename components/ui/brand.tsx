import Link from "next/link";

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5" aria-label="Автопилот — на главную">
      <span className={`${compact ? "size-7" : "size-14"} flex shrink-0 items-center justify-center rounded-[8px] border-[1.5px] border-[#2463eb] bg-white shadow-soft`}>
        <svg width={compact ? 16 : 32} height={compact ? 16 : 32} viewBox="0 0 32 32" fill="none" stroke="#2463eb" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M28 4 4 13l8.4 4.4 3.1 8.6z" /><path d="M28 4 12.4 17.4" />
          {!compact ? <><circle cx="8.4" cy="24.4" r="1.5" fill="#2463eb" stroke="none" /><circle cx="4.2" cy="28.2" r="1.1" fill="#2463eb" stroke="none" opacity=".55" /></> : null}
        </svg>
      </span>
      <span className={`${compact ? "text-[16px]" : "text-[20px]"} font-heading font-extrabold tracking-[-0.04em]`}>Автопилот</span>
    </Link>
  );
}
