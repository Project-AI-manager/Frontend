"use client";

import { useQuery } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";

import { LogoutButton } from "@/components/auth/logout-button";
import { AppShell } from "@/components/layout/app-shell";
import { getApiErrorMessage } from "@/lib/api/errors";
import { getUsers } from "@/lib/api/generated/users/users";
import { settingsApi } from "@/lib/api/settings";

const usersApi = getUsers();

export default function ProfilePage() {
  const userQuery = useQuery({ queryKey: ["profile-user"], queryFn: usersApi.meApiV1UsersMeGet });
  const workspaceQuery = useQuery({ queryKey: ["profile-workspace"], queryFn: settingsApi.getWorkspaceSettings });
  const error = userQuery.error ?? workspaceQuery.error;

  return <AppShell title="Профиль" description="Личные данные и уведомления.">
    {userQuery.isLoading || workspaceQuery.isLoading ? <ProfileSkeleton /> : error || !userQuery.data || !workspaceQuery.data ? <div className="flex min-h-72 flex-col items-center justify-center rounded-lg border border-[#d9e1ec] bg-white p-8 text-center"><RefreshCw className="text-[#2463eb]" /><h2 className="mt-4 text-xl font-extrabold">Профиль не загрузился</h2><p className="mt-2 text-sm text-[#526071]">{getApiErrorMessage(error, "Не удалось получить данные пользователя.")}</p><button type="button" onClick={() => { userQuery.refetch(); workspaceQuery.refetch(); }} className="mt-5 rounded-lg bg-[#2463eb] px-5 py-2.5 text-sm font-semibold text-white">Повторить</button></div> : <ProfileContent user={userQuery.data} workspace={workspaceQuery.data} />}
  </AppShell>;
}

function ProfileContent({ user, workspace }: { user: Awaited<ReturnType<typeof usersApi.meApiV1UsersMeGet>>; workspace: Awaited<ReturnType<typeof settingsApi.getWorkspaceSettings>> }) {
  const names = user.full_name.trim().split(/\s+/);
  const [firstName, setFirstName] = useState(names[0] ?? "");
  const [lastName, setLastName] = useState(names.slice(1).join(" "));
  const [company, setCompany] = useState(workspace.name);
  const [phone, setPhone] = useState("");
  const [telegram, setTelegram] = useState("");
  const [telegramAlerts, setTelegramAlerts] = useState(true);
  const [emailDigest, setEmailDigest] = useState(false);
  const [notice, setNotice] = useState("");
  const fullName = [firstName, lastName].filter(Boolean).join(" ") || "Пользователь";
  const initials = useMemo(() => [firstName, lastName].filter(Boolean).map((part) => part[0]).join("").toUpperCase() || "АП", [firstName, lastName]);

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setNotice("");
    try { if (company !== workspace.name) await settingsApi.updateWorkspaceSettings({ name: company }); setNotice("Данные сохранены"); }
    catch (saveError) { setNotice(getApiErrorMessage(saveError, "Не удалось сохранить данные.")); }
  }

  return <div className="grid gap-4 xl:grid-cols-[280px_1fr]">
      <aside className="rounded-lg border border-[#d9e1ec] bg-white p-6 shadow-[0_10px_22px_rgba(18,39,76,.07)]">
        <div className="flex size-20 items-center justify-center rounded-full bg-[#eaf1ff] text-2xl font-extrabold text-[#1546ad]">{initials}</div><h2 className="mt-5 text-xl font-extrabold">{fullName}</h2><p className="mt-1 break-all text-sm text-[#64717f]">{user.email}</p>
        <div className="my-6 h-px bg-[#e5eaf1]" /><dl className="space-y-5"><div><dt className="text-[11px] font-extrabold uppercase tracking-[.12em] text-[#64717f]">В сервисе с</dt><dd className="mt-1.5 text-sm font-semibold">14.03.2026</dd></div><div><dt className="text-[11px] font-extrabold uppercase tracking-[.12em] text-[#64717f]">Последний вход</dt><dd className="mt-1.5 text-sm font-semibold">сегодня, 09:12</dd></div><div><dt className="text-[11px] font-extrabold uppercase tracking-[.12em] text-[#64717f]">Роль</dt><dd className="mt-1.5 text-sm font-semibold capitalize">{user.role}</dd></div></dl>
      </aside>
      <div className="space-y-4">
        <form onSubmit={saveProfile} className="rounded-lg border border-[#d9e1ec] bg-white p-6 shadow-[0_10px_22px_rgba(18,39,76,.07)]"><h2 className="text-lg font-extrabold">Личные данные</h2><div className="my-5 h-px bg-[#e5eaf1]" /><div className="grid gap-x-5 gap-y-4 md:grid-cols-2 xl:grid-cols-3">
          <Field label="Имя" value={firstName} onChange={setFirstName} /><Field label="Фамилия" value={lastName} onChange={setLastName} /><Field label="Компания" value={company} onChange={setCompany} /><Field label="Почта" value={user.email} readOnly /><Field label="Телефон" value={phone} onChange={setPhone} placeholder="+7 921 000-00-00" /><Field label="Telegram" value={telegram} onChange={setTelegram} placeholder="@username" />
        </div><div className="mt-5 flex items-center justify-end gap-3">{notice && <span role="status" className="text-sm font-semibold text-[#526071]">{notice}</span>}<button type="submit" className="min-h-10 rounded-lg bg-[#2463eb] px-5 text-sm font-semibold text-white">Сохранить</button></div></form>
        <section className="rounded-lg border border-[#d9e1ec] bg-white p-6 shadow-[0_10px_22px_rgba(18,39,76,.07)]"><h2 className="text-lg font-extrabold">Уведомления</h2><div className="my-5 h-px bg-[#e5eaf1]" /><NotificationRow label="Присылать в Telegram, когда нужен человек" checked={telegramAlerts} onChange={setTelegramAlerts} /><div className="my-5 h-px bg-[#e5eaf1]" /><NotificationRow label="Сводка за день на почту" checked={emailDigest} onChange={setEmailDigest} /></section>
        <section className="flex flex-wrap items-center justify-between gap-5 rounded-lg border border-[#d9e1ec] bg-white p-6 shadow-[0_10px_22px_rgba(18,39,76,.07)]"><div><h2 className="font-extrabold">Выйти из аккаунта</h2><p className="mt-1 text-[13px] text-[#64717f]">Сессия закроется на этом компьютере</p></div><LogoutButton className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-[#d84545] px-5 text-sm font-semibold text-[#a72f2f] hover:bg-[#fdeded] disabled:opacity-50" /></section>
      </div>
    </div>;
}

function Field({ label, value, onChange, placeholder, readOnly = false }: { label: string; value: string; onChange?: (value: string) => void; placeholder?: string; readOnly?: boolean }) { return <label className="flex flex-col gap-1.5"><span className="text-[13px] font-semibold">{label}</span><input type="text" value={value} placeholder={placeholder} readOnly={readOnly} onChange={(event) => onChange?.(event.target.value)} className="min-h-11 rounded-lg border border-[#d9e1ec] bg-white px-3.5 text-sm outline-none transition focus:border-[#2463eb] focus:ring-4 focus:ring-[#eaf1ff] read-only:bg-[#f4f7fb] read-only:text-[#64717f]" /></label>; }
function NotificationRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) { return <div className="flex items-center justify-between gap-6"><span className="text-sm font-semibold">{label}</span><button type="button" role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)} className={`flex h-[26px] w-11 shrink-0 items-center rounded-full p-[3px] ${checked ? "justify-end bg-[#2463eb]" : "justify-start bg-[#d9e1ec]"}`}><span className="size-5 rounded-full bg-white shadow-sm" /></button></div>; }
function ProfileSkeleton() { return <div className="grid animate-pulse gap-4 xl:grid-cols-[280px_1fr]"><div className="h-96 rounded-lg bg-[#e5eaf1]" /><div className="space-y-4"><div className="h-80 rounded-lg bg-[#e5eaf1]" /><div className="h-40 rounded-lg bg-[#e5eaf1]" /></div></div>; }
