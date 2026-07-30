"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MoreHorizontal, RefreshCw } from "lucide-react";
import { useState } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { ChannelIcon } from "@/components/channels/channel-icon";
import { TelegramConnectDialog } from "@/components/settings/telegram-connect-dialog";
import { channelsManagementApi } from "@/lib/api/channels";
import { getApiErrorMessage } from "@/lib/api/errors";
import type { ChannelResponse } from "@/lib/api/generated/ai.schemas";
import { getChannels } from "@/lib/api/generated/channels/channels";

const channelsApi = getChannels();

const channelCatalog = [
  { type: "telegram", mark: "TG", name: "Telegram" },
  { type: "whatsapp", mark: "WA", name: "WhatsApp" },
  { type: "avito", mark: "AV", name: "Avito" },
  { type: "vk", mark: "VK", name: "VK" },
  { type: "instagram", mark: "IG", name: "Instagram" },
  { type: "max", mark: "MAX", name: "Max" },
] as const;

export default function ChannelsPage() {
  const client = useQueryClient();
  const [telegramDialogOpen, setTelegramDialogOpen] = useState(false);
  const [menuChannelId, setMenuChannelId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const channelsQuery = useQuery({
    queryKey: ["channels"],
    queryFn: () => channelsApi.listChannelsApiV1ChannelsGet(),
    retry: 1,
    retryDelay: 0,
  });
  const disconnect = useMutation({
    mutationFn: (channelId: string) => channelsManagementApi.disconnect(channelId),
    onSuccess: async () => {
      setMenuChannelId(null);
      setFeedback("Канал отключён");
      await client.invalidateQueries({ queryKey: ["channels"] });
      window.setTimeout(() => setFeedback(null), 3000);
    },
  });

  return (
    <AppShell
      title="Каналы"
      description="Подключения, через которые клиенты пишут ассистенту."
      immersive
    >
      <div className="relative h-full min-h-0 overflow-hidden">
        <div className="relative flex h-full min-h-0 flex-col gap-4 overflow-y-auto px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
          {channelsQuery.isLoading ? <ChannelsSkeleton /> : null}

          {channelsQuery.error ? (
            <StateCard
              title="Статусы каналов недоступны"
              text={getApiErrorMessage(
                channelsQuery.error,
                "Ошибка запроса. Подключение Telegram по-прежнему доступно.",
              )}
              onRetry={() => void channelsQuery.refetch()}
            />
          ) : null}

          {!channelsQuery.isLoading ? (
            <div className="relative">
              {feedback ? (
                <p role="status" className="absolute right-0 bottom-[calc(100%+8px)] z-30 rounded-lg border border-[#13a66b]/25 bg-[#e8f7f0] px-4 py-3 text-sm font-semibold text-[#08724b] shadow-[0_12px_30px_rgba(18,39,76,.13)]">
                  {feedback}
                </p>
              ) : null}
              {disconnect.isError ? (
                <p role="alert" className="mb-3 rounded-lg border border-[#d84545]/30 bg-[#fdeded] px-4 py-3 text-sm text-[#a72f2f]">
                  {getApiErrorMessage(disconnect.error, "Не удалось отключить канал.")}
                </p>
              ) : null}
              <ChannelsCard
                channels={channelsQuery.data ?? []}
                menuChannelId={menuChannelId}
                disconnectingChannelId={disconnect.isPending ? disconnect.variables : null}
                onConnectTelegram={() => setTelegramDialogOpen(true)}
                onToggleMenu={(channelId) =>
                  setMenuChannelId((current) => current === channelId ? null : channelId)
                }
                onDisconnect={(channelId) => disconnect.mutate(channelId)}
              />
            </div>
          ) : null}
        </div>
      </div>

      {telegramDialogOpen ? (
        <TelegramConnectDialog
          onClose={() => setTelegramDialogOpen(false)}
          onConnected={async () => {
            await client.invalidateQueries({ queryKey: ["channels"] });
          }}
        />
      ) : null}
    </AppShell>
  );
}

function ChannelsCard({
  channels,
  menuChannelId,
  disconnectingChannelId,
  onConnectTelegram,
  onToggleMenu,
  onDisconnect,
}: {
  channels: ChannelResponse[];
  menuChannelId: string | null;
  disconnectingChannelId: string | null;
  onConnectTelegram: () => void;
  onToggleMenu: (channelId: string) => void;
  onDisconnect: (channelId: string) => void;
}) {
  return (
    <section className="flex flex-col gap-[18px] rounded-lg border border-[#d9e1ec] bg-white p-6 shadow-[0_10px_22px_rgba(18,39,76,.07)]">
      <h2 className="font-heading text-lg font-extrabold tracking-[-.03em]">
        Каналы связи
      </h2>
      <div className="h-px shrink-0 bg-[#e5eaf1]" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {channelCatalog.map((item) => {
          const channel = findChannel(channels, item.type);
          const connected = isConnected(channel);

          return (
            <article
              key={item.type}
              className="relative flex min-h-[148px] items-center gap-5 rounded-xl border border-[#d9e1ec] bg-white px-5 py-5 transition-[border-color,background,box-shadow] hover:border-[#c9d6e8] hover:bg-[#f8fbff] hover:shadow-[0_14px_30px_rgba(18,39,76,.06)]"
            >
              <ChannelMark type={item.type} label={item.name} />
              <span className="flex min-w-0 flex-col gap-2">
                <span className="truncate font-heading text-lg font-extrabold tracking-[-.025em]">{item.name}</span>
                <span
                  className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[.06em] ${connected ? "text-[#0c7a4e]" : "text-[#94600b]"}`}
                >
                  <span
                    className={`size-1.5 rounded-full ${connected ? "bg-[#13a66b]" : "bg-[#e89120]"}`}
                  />
                  {connected ? "Работает" : "Не подключено"}
                </span>
              </span>
              {connected ? (
                <div className="relative ml-auto self-center">
                  <button
                    type="button"
                    aria-label={`Меню канала ${item.name}`}
                    aria-expanded={menuChannelId === channel?.id}
                    onClick={() => channel && onToggleMenu(channel.id)}
                    disabled={disconnectingChannelId === channel?.id}
                    className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-transparent bg-transparent text-[#64717f] hover:bg-[#eaf1ff] disabled:opacity-50"
                  >
                    <MoreHorizontal size={21} strokeWidth={1.75} />
                  </button>
                  {channel && menuChannelId === channel.id ? (
                    <div role="menu" aria-label={`Действия с каналом ${item.name}`} className="absolute right-0 top-[46px] z-20 min-w-[184px] rounded-lg border border-[#d9e1ec] bg-white p-1.5 shadow-[0_14px_34px_rgba(18,39,76,.16)]">
                      <button type="button" role="menuitem" onClick={() => onDisconnect(channel.id)} disabled={disconnectingChannelId === channel.id} className="flex min-h-10 w-full items-center rounded-md px-3 text-left text-sm font-semibold text-[#b93838] hover:bg-[#fdeded] disabled:opacity-50">
                        {disconnectingChannelId === channel.id ? "Отключаем…" : "Отключить канал"}
                      </button>
                    </div>
                  ) : null}
                </div>
              ) : item.type === "telegram" ? (
                <button
                  type="button"
                  onClick={onConnectTelegram}
                  className="ml-auto inline-flex min-h-10 shrink-0 items-center rounded-lg border border-[#2463eb] px-4 text-[13px] font-semibold text-[#1546ad] hover:bg-[#eaf1ff]"
                >
                  Подключить
                </button>
              ) : (
                <span className="ml-auto text-[12px] font-semibold text-[#64717f]">
                  Скоро
                </span>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}

function ChannelMark({ type, label }: { type: string; label: string }) {
  const styles: Record<string, string> = {
    telegram: "border-[#b9dffc] bg-[#e9f6ff] text-[#168bd2]",
    whatsapp: "border-[#bdebd0] bg-[#ecfbf2] text-[#149b50]",
    avito: "border-[#d8cdfd] bg-[#f3efff] text-[#654bd3]",
    vk: "border-[#bddaff] bg-[#edf5ff] text-[#1676d2]",
    instagram: "border-[#efc6dc] bg-[#fff0f7] text-[#c63377]",
    max: "border-[#c9d6e8] bg-[#f4f7fb] text-[#415066]",
  };
  return (
    <span className={`flex size-[76px] shrink-0 items-center justify-center overflow-hidden rounded-[20px] border p-[17px] ${styles[type] ?? styles.max}`}>
      <ChannelIcon type={type} label={`Логотип ${label}`} />
    </span>
  );
}

function findChannel(channels: ChannelResponse[], type: string) {
  return (
    channels.find(
      (channel) =>
        channel.type.toLocaleLowerCase("ru-RU") === type && isConnected(channel),
    ) ??
    channels.find(
      (channel) => channel.type.toLocaleLowerCase("ru-RU") === type,
    )
  );
}

function isConnected(channel?: ChannelResponse) {
  const active = channel?.status === "active" || channel?.status === "connected";
  return Boolean(
    active &&
      (channel?.type.toLocaleLowerCase("ru-RU") !== "telegram" ||
        channel.settings.transport === "mtproto"),
  );
}

function ChannelsSkeleton() {
  return (
    <div
      role="status"
      aria-label="Загружаем каналы"
      className="h-[530px] animate-pulse rounded-lg bg-[#e5eaf1]"
    />
  );
}

function StateCard({
  title,
  text,
  onRetry,
}: {
  title: string;
  text: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex min-h-56 flex-col items-center justify-center rounded-lg border border-[#d9e1ec] bg-white p-8 text-center">
      <RefreshCw className="text-[#2463eb]" />
      <h2 className="mt-4 text-xl font-extrabold">{title}</h2>
      <p className="mt-2 max-w-md text-sm text-[#526071]">{text}</p>
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
