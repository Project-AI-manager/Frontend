"use client";

import { X } from "lucide-react";
import {
  KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
  useEffect,
  useRef,
} from "react";

export function ChannelConnectDialogShell({
  service,
  title,
  accentClass,
  busy = false,
  maxWidthClass = "max-w-[540px]",
  onClose,
  children,
}: {
  service: string;
  title: string;
  accentClass: string;
  busy?: boolean;
  maxWidthClass?: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const dialog = useRef<HTMLElement>(null);
  const closeRef = useRef(onClose);
  const busyRef = useRef(busy);
  const titleId = `${service.toLocaleLowerCase("en-US").replace(/[^a-z0-9]+/g, "-")}-dialog-title`;

  useEffect(() => {
    closeRef.current = onClose;
    busyRef.current = busy;
  }, [busy, onClose]);

  useEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busyRef.current) closeRef.current();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
      opener?.focus();
    };
  }, []);

  function keepFocusInside(event: ReactKeyboardEvent<HTMLElement>) {
    if (event.key !== "Tab") return;
    const focusable = Array.from(
      dialog.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
      ) ?? [],
    );
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return (
    <div
      className="fixed inset-0 z-[80] grid place-items-center overflow-y-auto bg-[#101828]/35 p-4 backdrop-blur-[2px]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onClose();
      }}
    >
      <section
        ref={dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onKeyDown={keepFocusInside}
        className={`my-auto w-full ${maxWidthClass} rounded-xl border border-[#d9e1ec] bg-white p-6 shadow-[0_24px_70px_rgba(18,39,76,.20)]`}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className={`text-[11px] font-extrabold uppercase tracking-[.12em] ${accentClass}`}>
              {service}
            </p>
            <h2 id={titleId} className="mt-1 font-heading text-xl font-extrabold tracking-[-.03em]">
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label={`Закрыть подключение ${service}`}
            className="flex size-10 shrink-0 items-center justify-center rounded-lg text-[#64717f] hover:bg-[#f4f7fb] disabled:opacity-50"
          >
            <X size={19} />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}
