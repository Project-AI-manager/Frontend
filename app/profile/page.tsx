import { Building2, ChevronRight, KeyRound, LogOut, Mail, UserRound } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";

export default function ProfilePage() {
  return (
    <AppShell title="Профиль" description="Личные данные, команда и безопасность аккаунта.">
      <div className="mx-auto max-w-3xl space-y-5">
        <section className="rounded-[26px] bg-white p-5 shadow-[0_1px_2px_rgba(11,20,26,0.08)] sm:p-6">
          <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
            <div className="flex size-20 shrink-0 items-center justify-center rounded-full bg-[#d9fdd3] text-2xl font-semibold text-[#008069]">АТ</div>
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-xl font-semibold text-[#111b21]">Алексей Тимофеев</h2>
              <p className="mt-1 text-sm text-[#667781]">Владелец рабочего пространства</p>
            </div>
            <button className="inline-flex min-h-10 items-center justify-center rounded-full border border-[#d8dee1] px-4 text-sm font-semibold text-[#111b21] transition hover:bg-[#f0f2f5] focus-visible:outline-2 focus-visible:outline-[#00a884]">Изменить</button>
          </div>
        </section>

        <section className="overflow-hidden rounded-[26px] bg-white shadow-[0_1px_2px_rgba(11,20,26,0.08)]">
          <h2 className="px-5 pb-2 pt-5 text-sm font-semibold text-[#008069] sm:px-6">Аккаунт</h2>
          <ul className="divide-y divide-[#e9edef]">
            <ProfileItem icon={UserRound} label="Имя" value="Алексей Тимофеев" />
            <ProfileItem icon={Mail} label="Email" value="alexey@example.com" />
            <ProfileItem icon={Building2} label="Компания" value="Автопилот" />
            <ProfileItem icon={KeyRound} label="Пароль и безопасность" value="Обновлён 12 дней назад" />
          </ul>
        </section>

        <button className="flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-[#d92d20] shadow-[0_1px_2px_rgba(11,20,26,0.08)] transition hover:bg-[#fff5f4] focus-visible:outline-2 focus-visible:outline-[#d92d20]">
          <LogOut aria-hidden="true" size={18} />
          Выйти из аккаунта
        </button>
      </div>
    </AppShell>
  );
}

function ProfileItem({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof UserRound;
  label: string;
  value: string;
}) {
  return (
    <li>
      <button className="flex min-h-18 w-full items-center gap-4 px-5 py-3.5 text-left transition hover:bg-[#f7f8fa] focus-visible:outline-2 focus-visible:outline-[#00a884] sm:px-6">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#f0f2f5] text-[#54656f]">
          <Icon aria-hidden="true" size={19} strokeWidth={1.8} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-xs text-[#667781]">{label}</span>
          <span className="mt-0.5 block truncate text-sm font-medium text-[#111b21]">{value}</span>
        </span>
        <ChevronRight aria-hidden="true" className="text-[#8696a0]" size={18} />
      </button>
    </li>
  );
}
