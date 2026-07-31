"use client";

import { ArrowLeft, ArrowRight, Check, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";

import { getUsers } from "@/lib/api/generated/users/users";
import { getAccessToken } from "@/lib/api/token";

type TourPlacement = "top" | "bottom" | "left" | "right";

type TourStep = {
  id: string;
  path: string;
  target: string;
  eyebrow: string;
  title: string;
  body: string;
  placement?: TourPlacement;
  spotlightPadding?: number;
  spotlightPaddingX?: number;
  spotlightPaddingY?: number;
  spotlightRadius?: number;
  cardOffset?: number;
};

type HighlightRect = {
  top: number;
  left: number;
  width: number;
  height: number;
  radius: number;
};

const tourSteps: TourStep[] = [
  {
    id: "inbox-navigation",
    path: "/inbox",
    target: "tour-nav-inbox",
    eyebrow: "Диалоги",
    title: "Здесь находятся диалоги",
    body: "В этом разделе собраны все ваши переписки с клиентами.",
    placement: "right",
  },
  {
    id: "knowledge-overview",
    path: "/knowledge",
    target: "tour-nav-knowledge",
    eyebrow: "База знаний",
    title: "Здесь находится база знаний",
    body: "В этом разделе хранятся материалы, которые Автопилот использует для ответов клиентам.",
    placement: "right",
  },
  {
    id: "knowledge-upload",
    path: "/knowledge",
    target: "tour-knowledge-upload",
    eyebrow: "База знаний",
    title: "Сначала добавьте материалы",
    body: "Перетащите PDF, DOCX, XLSX, MD или TXT в эту область либо выберите несколько файлов с устройства. Сама загрузка ещё не включает материалы в ответы.",
    placement: "bottom",
  },
  {
    id: "knowledge-index",
    path: "/knowledge",
    target: "tour-knowledge-index",
    eyebrow: "База знаний",
    title: "Обязательно обновите базу знаний",
    body: "После загрузки файлов нажмите «Обновить базу знаний». Только после обновления Автопилот сможет использовать новые материалы в ответах.",
    placement: "top",
    cardOffset: 16,
  },
  {
    id: "channels-grid",
    path: "/channels",
    target: "tour-nav-channels",
    eyebrow: "Каналы",
    title: "Здесь находятся каналы связи",
    body: "В этом разделе подключаются сервисы, через которые клиенты пишут вашей компании.",
    placement: "right",
  },
  {
    id: "analytics-overview",
    path: "/analytics",
    target: "tour-nav-analytics",
    eyebrow: "Аналитика",
    title: "Здесь находится аналитика",
    body: "В этом разделе можно оценивать обращения, ответы Автопилота и изменения показателей по дням.",
    placement: "right",
  },
  {
    id: "analytics-export",
    path: "/analytics",
    target: "tour-analytics-export",
    eyebrow: "Аналитика",
    title: "Скачайте подробный отчёт",
    body: "XLSX содержит данные по дням, клиентам, диалогам, сообщениям, токенам и расходам за выбранный период.",
    placement: "bottom",
  },
  {
    id: "settings-overview",
    path: "/settings",
    target: "tour-nav-settings",
    eyebrow: "Настройки",
    title: "Здесь находятся настройки",
    body: "В этом разделе настраивается работа Автопилота и контролируются расходы.",
    placement: "top",
    cardOffset: 16,
  },
  {
    id: "settings-auto-replies",
    path: "/settings",
    target: "tour-settings-auto-replies",
    eyebrow: "Настройки",
    title: "Разрешите Автопилоту отвечать",
    body: "Этот переключатель включает автоматические ответы. Когда он выключен, обращения остаются менеджеру.",
    placement: "bottom",
    spotlightPaddingX: 6,
    spotlightRadius: 10,
  },
  {
    id: "settings-confidence",
    path: "/settings",
    target: "tour-settings-confidence",
    eyebrow: "Настройки",
    title: "Настройте долю автоматических ответов",
    body: "Чем выше значение, тем чаще Автопилот отвечает самостоятельно. При низкой уверенности запрос передаётся менеджеру. Начните осторожно и увеличивайте долю после проверки диалогов.",
    placement: "bottom",
    spotlightPaddingX: 6,
    spotlightRadius: 10,
  },
  {
    id: "profile-notifications",
    path: "/profile",
    target: "tour-profile-notifications",
    eyebrow: "Профиль",
    title: "Настройте уведомления",
    body: "Включите письма, чтобы получать уведомления, когда Автопилоту требуется помощь менеджера.",
    placement: "top",
  },
];

const viewportGap = 16;
const defaultCardGap = 8;
const cardWidth = 360;
const tourPaths = new Set([...tourSteps.map((item) => item.path), "/profile"]);
const usersApi = getUsers();

export function ProductTour() {
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const mounted = useSyncExternalStore(
    subscribeToClient,
    getClientSnapshot,
    getServerSnapshot,
  );
  const [active, setActive] = useState(false);
  const [eligibilityChecked, setEligibilityChecked] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState<HighlightRect | null>(null);
  const [targetReady, setTargetReady] = useState(false);
  const [targetMissing, setTargetMissing] = useState(false);
  const [cardMeasurement, setCardMeasurement] = useState<{
    stepId: string;
    height: number;
  } | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const tourStarted = useRef(false);
  const step = tourSteps[stepIndex];

  useEffect(() => {
    if (!mounted || eligibilityChecked) return;
    const accessToken = getAccessToken();
    // Registration and email verification mount this global component before
    // authentication is ready. Leave eligibility unchecked there so the first
    // authenticated tour route can still start onboarding.
    if (!accessToken || !tourPaths.has(pathname)) return;

    let cancelled = false;
    void usersApi
      .meApiV1UsersMeGet()
      .then((user) => {
        if (cancelled || user.onboarding_seen) return;
        if (!cancelled) setActive(true);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setEligibilityChecked(true);
      });

    return () => {
      cancelled = true;
    };
  }, [eligibilityChecked, mounted, pathname]);

  useEffect(() => {
    if (!mounted || !active || tourStarted.current) return;
    tourStarted.current = true;
    if (pathname !== tourSteps[0].path) {
      router.replace(tourSteps[0].path);
    }
  }, [active, mounted, pathname, router]);

  const measureTarget = useCallback(() => {
    const element = findTourTarget(step.target);
    if (!element) {
      setTargetReady(false);
      setRect(null);
      return false;
    }
    const targetRect = element.getBoundingClientRect();
    const targetStyle = window.getComputedStyle(element);
    const intersectsViewport =
      targetRect.bottom > 0 &&
      targetRect.right > 0 &&
      targetRect.top < window.innerHeight &&
      targetRect.left < window.innerWidth;
    if (!intersectsViewport) {
      element.scrollIntoView({ block: "center", inline: "center", behavior: "smooth" });
      setTargetReady(false);
      setRect(null);
      return false;
    }

    const padding = step.spotlightPadding ?? 0;
    const paddingX = step.spotlightPaddingX ?? padding;
    const paddingY = step.spotlightPaddingY ?? padding;
    const top = clamp(targetRect.top - paddingY, 0, window.innerHeight);
    const left = clamp(targetRect.left - paddingX, 0, window.innerWidth);
    const right = clamp(targetRect.right + paddingX, 0, window.innerWidth);
    const bottom = clamp(targetRect.bottom + paddingY, 0, window.innerHeight);
    if (right <= left || bottom <= top) return false;
    setRect({
      top,
      left,
      width: right - left,
      height: bottom - top,
      radius:
        step.spotlightRadius ??
        getElementRadius(targetStyle) + Math.max(paddingX, paddingY),
    });
    setTargetMissing(false);
    setTargetReady(true);
    return true;
  }, [
    step.spotlightPadding,
    step.spotlightPaddingX,
    step.spotlightPaddingY,
    step.spotlightRadius,
    step.target,
  ]);

  useEffect(() => {
    if (!active || pathname !== step.path) return;
    let attempts = 0;
    const interval = window.setInterval(() => {
      attempts += 1;
      if (measureTarget()) {
        window.clearInterval(interval);
      } else if (attempts >= 50) {
        setTargetMissing(true);
        window.clearInterval(interval);
      }
    }, 100);
    return () => window.clearInterval(interval);
  }, [active, measureTarget, pathname, step.path]);

  useLayoutEffect(() => {
    if (!active || !targetReady) return;
    const update = () => measureTarget();
    const target = findTourTarget(step.target);
    const resizeObserver =
      target && typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(update)
        : null;
    if (target) resizeObserver?.observe(target);
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    window.visualViewport?.addEventListener("resize", update);
    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
      window.visualViewport?.removeEventListener("resize", update);
    };
  }, [active, measureTarget, step.target, targetReady]);

  useEffect(() => {
    if (!active) return;
    if (!previousFocus.current) {
      previousFocus.current = document.activeElement as HTMLElement | null;
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [active]);

  useLayoutEffect(() => {
    const card = cardRef.current;
    if (!active || !targetReady || !card) return;

    const measureCard = () => {
      const height = card.getBoundingClientRect().height;
      if (height > 0) {
        setCardMeasurement({ stepId: step.id, height });
      }
    };

    measureCard();
    if (typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(measureCard);
    observer.observe(card);
    return () => observer.disconnect();
  }, [active, step.id, targetReady]);

  const cardHeight =
    cardMeasurement?.stepId === step.id ? cardMeasurement.height : null;

  useEffect(() => {
    if (active && targetReady && cardHeight !== null) cardRef.current?.focus();
  }, [active, cardHeight, step.id, targetReady]);

  const moveTo = useCallback((nextIndex: number) => {
    const boundedIndex = Math.max(0, Math.min(tourSteps.length - 1, nextIndex));
    if (boundedIndex === stepIndex) return;
    const nextStep = tourSteps[boundedIndex];
    setTargetReady(false);
    setRect(null);
    setTargetMissing(false);
    setStepIndex(boundedIndex);
    if (pathname !== nextStep.path) {
      router.push(nextStep.path);
    }
  }, [pathname, router, stepIndex]);

  const dismissTour = useCallback(() => {
    setActive(false);
    setRect(null);
    setTargetReady(false);
    window.requestAnimationFrame(() => previousFocus.current?.focus());
  }, []);

  const completeTour = useCallback(() => {
    dismissTour();
    void usersApi
      .markOnboardingSeenApiV1UsersMeOnboardingSeenPost()
      .catch(() => {
        // The backend remains the source of truth. If saving failed, onboarding
        // will be offered again on the next authenticated visit.
      });
  }, [dismissTour]);

  useEffect(() => {
    if (!active) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Tab" && cardRef.current) {
        const focusable = Array.from(
          cardRef.current.querySelectorAll<HTMLElement>("button:not([disabled]), [href], [tabindex]:not([tabindex='-1'])"),
        );
        if (focusable.length > 0) {
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
        return;
      }
      if (event.key === "Escape") {
        dismissTour();
      }
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      if (event.key === "ArrowRight") {
        event.preventDefault();
        moveTo(stepIndex + 1);
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        moveTo(stepIndex - 1);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [active, dismissTour, moveTo, stepIndex]);

  if (!mounted || !active) return null;

  if (!rect || pathname !== step.path) {
    if (!targetMissing) return null;
    return createPortal(
      <div
        className="fixed inset-0 z-[100] grid place-items-center bg-black/78"
        role="status"
        aria-live="polite"
        data-testid="product-tour-loading"
      >
        <div className="flex max-w-[min(420px,calc(100vw-32px))] flex-col items-center gap-4 rounded-[12px] bg-[#111318] px-5 py-4 text-center text-sm font-semibold text-white shadow-[0_24px_80px_rgba(0,0,0,.52)]">
          <span>Этот блок сейчас недоступен</span>
          <div className="flex gap-2">
            <button type="button" onClick={completeTour} className="rounded-[8px] px-3 py-2 text-white/70 hover:bg-white/10 hover:text-white">
              Пропустить обучение
            </button>
            <button type="button" onClick={() => moveTo(stepIndex + 1)} className="rounded-[8px] bg-[#2463eb] px-3 py-2 text-white hover:bg-[#1d55cf]">
              Следующий шаг
            </button>
          </div>
        </div>
      </div>,
      document.body,
    );
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[100]"
      role="dialog"
      aria-modal="true"
      aria-label={`Обучение: ${step.title}`}
      data-testid="product-tour"
    >
      <svg
        className="pointer-events-none fixed inset-0 size-full"
        width="100%"
        height="100%"
        aria-hidden="true"
      >
        <defs>
          <mask id="product-tour-mask" maskUnits="userSpaceOnUse">
            <rect width="100%" height="100%" fill="white" />
            <rect
              x={rect.left}
              y={rect.top}
              width={rect.width}
              height={rect.height}
              rx={rect.radius}
              fill="black"
            />
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(0,0,0,.78)"
          mask="url(#product-tour-mask)"
        />
      </svg>
      <div
        className="pointer-events-none fixed"
        style={{
          ...rect,
          borderRadius: rect.radius,
        }}
        data-testid="product-tour-spotlight"
      />
      <div
        ref={cardRef}
        tabIndex={-1}
        className="fixed max-h-[calc(100vh-32px)] w-[min(360px,calc(100vw-32px))] overflow-y-auto rounded-[12px] border border-white/12 bg-[#111318] p-5 text-white shadow-[0_24px_80px_rgba(0,0,0,.52)] outline-none transition-opacity duration-100 motion-reduce:transition-none"
        style={{
          ...cardPosition(
            rect,
            step.placement ?? "bottom",
            cardHeight ?? 0,
            step.cardOffset ?? defaultCardGap,
          ),
          opacity: cardHeight === null ? 0 : 1,
          pointerEvents: cardHeight === null ? "none" : "auto",
        }}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[.14em] text-[#91b6ff]">
              {step.eyebrow}
            </p>
            <h2 className="mt-2 font-heading text-[19px] font-extrabold leading-[1.25] tracking-[-.025em]">
              {step.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={dismissTour}
            aria-label="Закрыть обучение"
            className="flex size-9 shrink-0 items-center justify-center rounded-[8px] text-white/65 hover:bg-white/10 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>
        <p className="mt-3 text-[13px] leading-5.5 text-white/72">{step.body}</p>

        <div className="mt-5 flex items-center gap-2">
          <span className="mr-auto text-[12px] font-semibold tabular-nums text-white/48">
            {stepIndex + 1} из {tourSteps.length}
          </span>
          <button
            type="button"
            onClick={completeTour}
            className="min-h-9 rounded-[8px] px-3 text-[13px] font-semibold text-white/62 hover:bg-white/10 hover:text-white"
          >
            Пропустить
          </button>
          {stepIndex > 0 ? (
            <button
              type="button"
              onClick={() => moveTo(stepIndex - 1)}
              aria-label="Предыдущий шаг"
              className="flex size-9 items-center justify-center rounded-[8px] border border-white/14 text-white/78 hover:bg-white/10"
            >
              <ArrowLeft size={17} />
            </button>
          ) : null}
          <button
            type="button"
            onClick={() =>
              stepIndex === tourSteps.length - 1
                ? completeTour()
                : moveTo(stepIndex + 1)
            }
            className="inline-flex min-h-9 items-center gap-2 rounded-[8px] bg-[#2463eb] px-3.5 text-[13px] font-semibold text-white hover:bg-[#1d55cf]"
          >
            {stepIndex === tourSteps.length - 1 ? (
              <>
                Готово <Check size={16} />
              </>
            ) : (
              <>
                Далее <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function cardPosition(
  rect: HighlightRect,
  placement: TourPlacement,
  measuredHeight: number,
  gap: number,
): React.CSSProperties {
  const width = Math.min(cardWidth, window.innerWidth - viewportGap * 2);
  const estimatedHeight = Math.min(
    measuredHeight,
    window.innerHeight - viewportGap * 2,
  );
  const centeredLeft = clamp(
    rect.left + rect.width / 2 - width / 2,
    viewportGap,
    window.innerWidth - width - viewportGap,
  );
  const centeredTop = clamp(
    rect.top + rect.height / 2 - estimatedHeight / 2,
    viewportGap,
    window.innerHeight - estimatedHeight - viewportGap,
  );

  if (
    placement === "bottom" &&
    rect.top + rect.height + gap + estimatedHeight <= window.innerHeight - viewportGap
  ) {
    return { top: rect.top + rect.height + gap, left: centeredLeft };
  }
  if (placement === "top" && rect.top - gap - estimatedHeight >= viewportGap) {
    return { top: rect.top - gap - estimatedHeight, left: centeredLeft };
  }
  if (
    placement === "right" &&
    rect.left + rect.width + gap + width <= window.innerWidth - viewportGap
  ) {
    return { top: centeredTop, left: rect.left + rect.width + gap };
  }
  if (placement === "left" && rect.left - gap - width >= viewportGap) {
    return { top: centeredTop, left: rect.left - gap - width };
  }

  const roomBelow = window.innerHeight - (rect.top + rect.height);
  if (roomBelow >= rect.top) {
    return {
      top: clamp(
        rect.top + rect.height + gap,
        viewportGap,
        window.innerHeight - estimatedHeight - viewportGap,
      ),
      left: centeredLeft,
    };
  }
  return {
    top: clamp(
      rect.top - estimatedHeight - gap,
      viewportGap,
      window.innerHeight - estimatedHeight - viewportGap,
    ),
    left: centeredLeft,
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getElementRadius(style: CSSStyleDeclaration) {
  const radiusValues = style.borderRadius
    ? [style.borderRadius]
    : [
        style.borderTopLeftRadius,
        style.borderTopRightRadius,
        style.borderBottomRightRadius,
        style.borderBottomLeftRadius,
      ];
  const radii = radiusValues
    .flatMap((value) => value.split(/[\s/]+/))
    .map((value) => Number.parseFloat(value))
    .filter(Number.isFinite);

  return radii.length > 0 ? Math.min(...radii) : 0;
}

function findTourTarget(targets: string) {
  for (const target of targets.split("|")) {
    const elements = document.querySelectorAll<HTMLElement>(`[data-tour="${target}"]`);
    for (const element of elements) {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      if (
        rect.width > 0 &&
        rect.height > 0 &&
        style.display !== "none" &&
        style.visibility !== "hidden"
      ) {
        return element;
      }
    }
  }
  return null;
}

function subscribeToClient() {
  return () => undefined;
}

function getClientSnapshot() {
  return true;
}

function getServerSnapshot() {
  return false;
}
