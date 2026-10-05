"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MoreHorizontal } from "lucide-react";
import { useEffect, useState } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { ChannelIcon } from "@/components/channels/channel-icon";
import { TelegramConnectDialog } from "@/components/settings/telegram-connect-dialog";
import { TelegramBotConnectDialog } from "@/components/settings/telegram-bot-connect-dialog";
import { WhatsAppConnectDialog } from "@/components/settings/whatsapp-connect-dialog";
import { AvitoConnectDialog } from "@/components/settings/avito-connect-dialog";
import { VkConnectDialog } from "@/components/settings/vk-connect-dialog";
import { InstagramConnectDialog } from "@/components/settings/instagram-connect-dialog";
import { MaxConnectDialog } from "@/components/settings/max-connect-dialog";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { channelsManagementApi } from "@/lib/api/channels";
import { getApiErrorMessage } from "@/lib/api/errors";
import type { ChannelResponse } from "@/lib/api/generated/ai.schemas";
import { getChannels } from "@/lib/api/generated/channels/channels";

const channelsApi = getChannels();

const channelCatalog: Array<{ type: string; mark: string; name: string; whatsappMode?: "personal" | "business"; comingSoon?: boolean }> = [
  { type: "telegram", mark: "TG", name: "Telegram" },
  { type: "telegram_bot", mark: "TB", name: "Telegram-бот" },
  { type: "whatsapp", mark: "WA", name: "WhatsApp", whatsappMode: "personal" },
  { type: "whatsapp", mark: "WA", name: "WhatsApp Business", whatsappMode: "business" },
  { type: "avito", mark: "AV", name: "Avito Premium" },
  { type: "avito", mark: "AV", name: "Avito для обычных аккаунтов", comingSoon: true },
  { type: "vk", mark: "VK", name: "VK" },
  { type: "instagram", mark: "IG", name: "Instagram" },
  { type: "max", mark: "MAX", name: "Max" },
] as const;
type ChannelCatalogEntry = (typeof channelCatalog)[number] & {
  key: string;
  channelOverride?: ChannelResponse;
  displayName: string;
};

export default function ChannelsPage() {
  const client = useQueryClient();
  const [telegramDialogOpen, setTelegramDialogOpen] = useState(false);
  const [replacingTelegram, setReplacingTelegram] = useState(false);
  const [telegramBotDialogOpen, setTelegramBotDialogOpen] = useState(false);
  const [whatsAppDialogOpen, setWhatsAppDialogOpen] = useState(false);
  const [whatsAppMethod, setWhatsAppMethod] = useState<"personal" | "business">("personal");
  const [replacingWhatsApp, setReplacingWhatsApp] = useState(false);
  const [replaceWhatsAppChannelId, setReplaceWhatsAppChannelId] = useState<string | undefined>();
  const [avitoDialogOpen, setAvitoDialogOpen] = useState(false);
  const [vkDialogOpen, setVkDialogOpen] = useState(false);
  const [replacingVk, setReplacingVk] = useState(false);
  const [instagramDialogOpen, setInstagramDialogOpen] = useState(false);
  const [replacingInstagram, setReplacingInstagram] = useState(false);
  const [maxDialogOpen, setMaxDialogOpen] = useState(false);
  const [replacingMax, setReplacingMax] = useState(false);
  const [menuChannelId, setMenuChannelId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const channelsQuery = useQuery({
    queryKey: ["channels"],
    queryFn: () => channelsApi.listChannelsApiV1ChannelsGet(),
    retry: 1,
    retryDelay: 0,
  });

  useEffect(() => {
    const instagramResult = new URLSearchParams(window.location.search).get("instagram");
    if (!instagramResult) return;
    const showFeedback = window.setTimeout(() => {
      setFeedback(instagramResult === "connected" ? "Instagram подключён" : instagramResult === "cancelled" ? "Подключение Instagram отменено" : "Не удалось подключить Instagram");
    }, 0);
    if (instagramResult === "connected") void client.invalidateQueries({ queryKey: ["channels"] });
    const url = new URL(window.location.href);
    url.searchParams.delete("instagram");
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
    const hideFeedback = window.setTimeout(() => setFeedback(null), 4000);
    return () => {
      window.clearTimeout(showFeedback);
      window.clearTimeout(hideFeedback);
    };
  }, [client]);

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
          {channelsQuery.isLoading ? <LoadingState label="Загружаем каналы…" className="min-h-[530px]" /> : null}

          {channelsQuery.error ? (
            <ErrorState
              title="Каналы не загрузились"
              message={getApiErrorMessage(
                channelsQuery.error,
                "Ошибка запроса к серверу.",
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
                onConnectTelegram={() => {
                  setReplacingTelegram(false);
                  setTelegramDialogOpen(true);
                }}
                onReconnectTelegram={() => {
                  setMenuChannelId(null);
                  setReplacingTelegram(true);
                  setTelegramDialogOpen(true);
                }}
                onConnectTelegramBot={() => setTelegramBotDialogOpen(true)}
                onReconnectTelegramBot={() => {
                  setMenuChannelId(null);
                  setTelegramBotDialogOpen(true);
                }}
                onConnectWhatsApp={(method) => {
                  setReplacingWhatsApp(false);
                  setReplaceWhatsAppChannelId(undefined);
                  setWhatsAppMethod(method);
                  setWhatsAppDialogOpen(true);
                }}
                onReconnectWhatsApp={(channelId) => {
                  setMenuChannelId(null);
                  setReplacingWhatsApp(true);
                  setReplaceWhatsAppChannelId(channelId);
                  setWhatsAppMethod("business");
                  setWhatsAppDialogOpen(true);
                }}
                onConnectAvito={() => setAvitoDialogOpen(true)}
                onConnectVk={() => {
                  setReplacingVk(false);
                  setVkDialogOpen(true);
                }}
                onReconnectVk={() => {
                  setMenuChannelId(null);
                  setReplacingVk(true);
                  setVkDialogOpen(true);
                }}
                onConnectInstagram={() => {
                  setReplacingInstagram(false);
                  setInstagramDialogOpen(true);
                }}
                onReconnectInstagram={() => {
                  setMenuChannelId(null);
                  setReplacingInstagram(true);
                  setInstagramDialogOpen(true);
                }}
                onConnectMax={() => {
                  setReplacingMax(false);
                  setMaxDialogOpen(true);
                }}
                onReconnectMax={() => {
                  setMenuChannelId(null);
                  setReplacingMax(true);
                  setMaxDialogOpen(true);
                }}
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
          replacing={replacingTelegram}
          onClose={() => setTelegramDialogOpen(false)}
          onConnected={async () => {
            await client.invalidateQueries({ queryKey: ["channels"] });
          }}
        />
      ) : null}
      {telegramBotDialogOpen ? (
        <TelegramBotConnectDialog
          onClose={() => setTelegramBotDialogOpen(false)}
          onConnected={async () => {
            await client.invalidateQueries({ queryKey: ["channels"] });
          }}
        />
      ) : null}
      {whatsAppDialogOpen ? (
        <WhatsAppConnectDialog
          replacing={replacingWhatsApp}
          initialMethod={whatsAppMethod}
          replaceChannelId={replaceWhatsAppChannelId}
          onClose={() => setWhatsAppDialogOpen(false)}
          onConnected={async () => {
            await client.invalidateQueries({ queryKey: ["channels"] });
          }}
        />
      ) : null}
      {avitoDialogOpen ? <AvitoConnectDialog replaceChannelId={activeChannelId(channelsQuery.data, "avito")} onClose={() => setAvitoDialogOpen(false)} /> : null}
      {vkDialogOpen ? (
        <VkConnectDialog
          replacing={replacingVk}
          replaceChannelId={replacingVk ? activeChannelId(channelsQuery.data, "vk") : undefined}
          initialGroupId={replacingVk ? channelSetting(channelsQuery.data, "vk", "group_id") : ""}
          initialName={replacingVk ? activeChannel(channelsQuery.data, "vk")?.name ?? "" : ""}
          onClose={() => setVkDialogOpen(false)}
          onConnected={async () => {
            await client.invalidateQueries({ queryKey: ["channels"] });
          }}
        />
      ) : null}
      {instagramDialogOpen ? (
        <InstagramConnectDialog replaceChannelId={replacingInstagram ? activeChannelId(channelsQuery.data, "instagram") : undefined} onClose={() => setInstagramDialogOpen(false)} />
      ) : null}
      {maxDialogOpen ? (
        <MaxConnectDialog
          replacing={replacingMax}
          replaceChannelId={replacingMax ? activeChannelId(channelsQuery.data, "max") : undefined}
          initialName={replacingMax ? activeChannel(channelsQuery.data, "max")?.name ?? "" : ""}
          onClose={() => setMaxDialogOpen(false)}
          onConnected={async () => { await client.invalidateQueries({ queryKey: ["channels"] }); }}
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
  onReconnectTelegram,
  onConnectTelegramBot,
  onReconnectTelegramBot,
  onConnectWhatsApp,
  onReconnectWhatsApp,
  onConnectAvito,
  onConnectVk,
  onReconnectVk,
  onConnectInstagram,
  onReconnectInstagram,
  onConnectMax,
  onReconnectMax,
  onToggleMenu,
  onDisconnect,
}: {
  channels: ChannelResponse[];
  menuChannelId: string | null;
  disconnectingChannelId: string | null;
  onConnectTelegram: () => void;
  onReconnectTelegram: () => void;
  onConnectTelegramBot: () => void;
  onReconnectTelegramBot: () => void;
  onConnectWhatsApp: (method: "personal" | "business") => void;
  onReconnectWhatsApp: (channelId: string) => void;
  onConnectAvito: () => void;
  onConnectVk: () => void;
  onReconnectVk: () => void;
  onConnectInstagram: () => void;
  onReconnectInstagram: () => void;
  onConnectMax: () => void;
  onReconnectMax: () => void;
  onToggleMenu: (channelId: string) => void;
  onDisconnect: (channelId: string) => void;
}) {
  const displayCatalog = channelCatalog.flatMap<ChannelCatalogEntry>((item) => {
    if (item.type !== "whatsapp") {
      return [{ ...item, key: item.comingSoon ? `${item.type}-coming-soon` : item.type, channelOverride: undefined, displayName: item.name }];
    }
    const personalMode = item.whatsappMode === "personal";
    const matchingWhatsAppChannels = channels.filter((candidate) =>
      candidate.type === "whatsapp" && isPersonalWhatsAppChannel(candidate) === personalMode,
    );
    // Personal QR sessions are single active-device connections. Older
    // disconnected records stay in the database, but should not appear as
    // another connectable account or be mistaken for Cloud API channels.
    const visibleWhatsAppChannels = personalMode
      ? matchingWhatsAppChannels.filter(isConnected)
      : matchingWhatsAppChannels;
    const entries: ChannelCatalogEntry[] = visibleWhatsAppChannels.map((channel, index) => ({
          ...item,
          key: `whatsapp-${item.whatsappMode}-${channel.id}`,
          channelOverride: channel,
          displayName: personalMode
            ? personalWhatsAppTitle(channel, index)
            : channel.name || `${item.name} ${index + 1}`,
        }));
    if (!personalMode || visibleWhatsAppChannels.length === 0) {
      entries.push({ ...item, key: `whatsapp-${item.whatsappMode}-add`, channelOverride: undefined, displayName: item.name });
    }
    return entries;
  });

  return (
    <section data-tour="tour-channels-grid" className="flex flex-col gap-[18px] rounded-lg border border-[#d9e1ec] bg-white p-6 shadow-[0_10px_22px_rgba(18,39,76,.07)]">
      <h2 className="font-heading text-lg font-extrabold tracking-[-.03em]">Каналы связи</h2>
      <div className="h-px shrink-0 bg-[#e5eaf1]" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {displayCatalog.map((item) => {
          const channel = item.comingSoon ? undefined : item.type === "whatsapp"
            ? item.channelOverride
            : findChannel(channels, item.type);
          const connected = isConnected(channel);

          return (
            <article
              key={item.key}
              className="relative flex min-h-[148px] items-center gap-5 rounded-xl border border-[#d9e1ec] bg-white px-5 py-5 transition-[border-color,background,box-shadow] hover:border-[#c9d6e8] hover:bg-[#f8fbff] hover:shadow-[0_14px_30px_rgba(18,39,76,.06)]"
            >
              <ChannelMark type={item.type} label={item.displayName} />
              <span className="flex min-w-0 flex-col gap-1.5">
                <span className="truncate font-heading text-lg font-extrabold tracking-[-.025em]">{item.displayName}</span>
                {item.type === "whatsapp" && !connected ? (
                  <span className="text-[13px] text-[#64717f]">
                    {item.whatsappMode === "personal" ? "Личный аккаунт · подключение по QR" : "Бизнес-аккаунт · официальный Meta API"}
                  </span>
                ) : null}
                {item.comingSoon ? (
                  <span className="text-[13px] text-[#64717f]">
                    Проверяем безопасный способ подключения без Messenger API
                  </span>
                ) : null}
                {connected && channel ? (
                  <span className="truncate text-[13px] text-[#526071]" title={channelIdentity(channel)}>
                    {item.type === "whatsapp" && item.whatsappMode === "personal"
                      ? "Личный аккаунт · QR"
                      : channelIdentity(channel)}
                  </span>
                ) : null}
                <span
                  className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[.06em] ${connected && item.type !== "telegram_bot" ? "text-[#0c7a4e]" : "text-[#94600b]"}`}
                >
                  <span
                    className={`size-1.5 rounded-full ${connected && item.type !== "telegram_bot" ? "bg-[#13a66b]" : "bg-[#e89120]"}`}
                  />
                  {connected
                    ? "Работает"
                    : item.comingSoon
                      ? "Изучаем подключение"
                      : item.type === "telegram_bot" && channel?.status === "pending"
                      ? "Токен проверен · нужен HTTPS webhook"
                      : "Не подключено"}
                </span>
              </span>
              {connected ? (
                <div data-tour={item.type === "telegram" ? "tour-channels-actions" : undefined} className="relative ml-auto self-center">
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
                      {item.type === "telegram" ? (
                        <button type="button" role="menuitem" onClick={onReconnectTelegram} className="flex min-h-10 w-full items-center rounded-md px-3 text-left text-sm font-semibold text-[#1546ad] hover:bg-[#eaf1ff]">
                          Заменить аккаунт…
                        </button>
                      ) : item.type === "telegram_bot" ? (
                        <button type="button" role="menuitem" onClick={onReconnectTelegramBot} className="flex min-h-10 w-full items-center rounded-md px-3 text-left text-sm font-semibold text-[#1546ad] hover:bg-[#eaf1ff]">
                          Обновить токен…
                        </button>
                      ) : item.type === "whatsapp" ? (
                        channel.settings.transport === "whatsmeow" ? null : (
                          <button type="button" role="menuitem" onClick={() => onReconnectWhatsApp(channel.id)} className="flex min-h-10 w-full items-center rounded-md px-3 text-left text-sm font-semibold text-[#1546ad] hover:bg-[#eaf1ff]">
                            Переподключить…
                          </button>
                        )
                      ) : item.type === "avito" ? (
                        <button type="button" role="menuitem" onClick={onConnectAvito} className="flex min-h-10 w-full items-center rounded-md px-3 text-left text-sm font-semibold text-[#1546ad] hover:bg-[#eaf1ff]">
                          Переподключить…
                        </button>
                      ) : item.type === "vk" ? (
                        <button type="button" role="menuitem" onClick={onReconnectVk} className="flex min-h-10 w-full items-center rounded-md px-3 text-left text-sm font-semibold text-[#1546ad] hover:bg-[#eaf1ff]">
                          Переподключить…
                        </button>
                      ) : item.type === "instagram" ? (
                        <button type="button" role="menuitem" onClick={onReconnectInstagram} className="flex min-h-10 w-full items-center rounded-md px-3 text-left text-sm font-semibold text-[#1546ad] hover:bg-[#eaf1ff]">
                          Переподключить…
                        </button>
                      ) : item.type === "max" ? (
                        <button type="button" role="menuitem" onClick={onReconnectMax} className="flex min-h-10 w-full items-center rounded-md px-3 text-left text-sm font-semibold text-[#1546ad] hover:bg-[#eaf1ff]">
                          Переподключить…
                        </button>
                      ) : null}
                      <button type="button" role="menuitem" onClick={() => onDisconnect(channel.id)} disabled={disconnectingChannelId === channel.id} className="flex min-h-10 w-full items-center rounded-md px-3 text-left text-sm font-semibold text-[#b93838] hover:bg-[#fdeded] disabled:opacity-50">
                        {disconnectingChannelId === channel.id ? "Отключаем…" : "Отключить канал"}
                      </button>
                    </div>
                  ) : null}
                </div>
              ) : (
                <button
                  data-tour={item.type === "telegram" ? "tour-channels-actions" : undefined}
                  type="button"
                  onClick={item.comingSoon ? undefined : item.type === "telegram" ? onConnectTelegram : item.type === "telegram_bot" ? onConnectTelegramBot : item.type === "whatsapp" ? () => onConnectWhatsApp(item.whatsappMode ?? "personal") : item.type === "avito" ? onConnectAvito : item.type === "vk" ? onConnectVk : item.type === "instagram" ? onConnectInstagram : onConnectMax}
                  disabled={item.comingSoon}
                  aria-label={item.type === "telegram_bot" && channel?.status === "pending" ? "Настроить Telegram-бота" : `Подключить ${item.name}`}
                  className="ml-auto inline-flex min-h-10 shrink-0 items-center rounded-lg border border-[#2463eb] px-4 text-[13px] font-semibold text-[#1546ad] hover:bg-[#eaf1ff] disabled:cursor-not-allowed disabled:border-[#d9e1ec] disabled:text-[#64717f] disabled:hover:bg-transparent"
                >
                  {item.comingSoon ? "В разработке" : item.type === "telegram_bot" && channel?.status === "pending" ? "Настроить" : "Подключить"}
                </button>
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
    telegram_bot: "border-[#b9dffc] bg-[#e9f6ff] text-[#168bd2]",
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

function activeChannelId(channels: ChannelResponse[] | undefined, type: string) {
  return channels?.find(
    (channel) => channel.type.toLocaleLowerCase("ru-RU") === type && isConnected(channel),
  )?.id;
}

function activeChannel(channels: ChannelResponse[] | undefined, type: string) {
  return channels?.find(
    (channel) => channel.type.toLocaleLowerCase("ru-RU") === type && isConnected(channel),
  );
}

function channelSetting(
  channels: ChannelResponse[] | undefined,
  type: string,
  key: string,
) {
  const value = activeChannel(channels, type)?.settings[key];
  return typeof value === "string" || typeof value === "number" ? String(value) : "";
}

function isConnected(channel?: ChannelResponse) {
  const active = channel?.status === "active" || channel?.status === "connected";
  return Boolean(
    active &&
      (channel?.type.toLocaleLowerCase("ru-RU") !== "telegram" ||
        channel.settings.transport === "mtproto"),
  );
}

function isPersonalWhatsAppChannel(channel: ChannelResponse) {
  if (channel.type.toLocaleLowerCase("ru-RU") !== "whatsapp") return false;
  return channel.settings.transport === "whatsmeow" || /@s\.whatsapp\.net\b/i.test(channel.name);
}

function personalWhatsAppTitle(channel: ChannelResponse, index: number) {
  const configuredPhone = channel.settings.phone_masked ?? channel.settings.display_phone_number;
  const phone = typeof configuredPhone === "string" ? configuredPhone.trim() : "";
  const jidPhone = channel.name.match(/(\+?\d+)(?::\d+)?@s\.whatsapp\.net\b/i)?.[1];
  const account = phone || (jidPhone ? (jidPhone.startsWith("+") ? jidPhone : `+${jidPhone}`) : "");
  return account ? `WhatsApp · ${account}` : channel.name || `WhatsApp ${index + 1}`;
}

function channelIdentity(channel: ChannelResponse) {
  const username = typeof channel.settings.username === "string"
    ? channel.settings.username.trim().replace(/^@/, "")
    : "";
  if (username) return `@${username}`;
  const botUsername = typeof channel.settings.bot_username === "string"
    ? channel.settings.bot_username.trim().replace(/^@/, "")
    : "";
  if (botUsername) return `@${botUsername}`;
  const phone = typeof channel.settings.phone_masked === "string"
    ? channel.settings.phone_masked.trim()
    : "";
  if (phone) return `Аккаунт ${phone}`;
  const displayPhone = typeof channel.settings.display_phone_number === "string"
    ? channel.settings.display_phone_number.trim()
    : "";
  if (displayPhone) return displayPhone;
  const phoneNumberId = typeof channel.settings.phone_number_id === "string"
    ? channel.settings.phone_number_id.trim()
    : "";
  if (phoneNumberId) return `Phone Number ID ${phoneNumberId}`;
  const screenName = typeof channel.settings.screen_name === "string"
    ? channel.settings.screen_name.trim().replace(/^@/, "")
    : "";
  if (screenName) return `@${screenName}`;
  const groupName = typeof channel.settings.group_name === "string"
    ? channel.settings.group_name.trim()
    : "";
  if (groupName) return groupName;
  const groupId = typeof channel.settings.group_id === "string" || typeof channel.settings.group_id === "number"
    ? String(channel.settings.group_id).trim()
    : "";
  if (groupId) return `Сообщество ${groupId}`;
  const displayName = typeof channel.settings.display_name === "string"
    ? channel.settings.display_name.trim()
    : "";
  if (displayName) return displayName;
  const instagramUserId = typeof channel.settings.instagram_user_id === "string" || typeof channel.settings.instagram_user_id === "number"
    ? String(channel.settings.instagram_user_id).trim()
    : "";
  if (instagramUserId) return `Instagram ${instagramUserId}`;
  const botId = typeof channel.settings.bot_id === "string" || typeof channel.settings.bot_id === "number"
    ? String(channel.settings.bot_id).trim()
    : "";
  if (botId) return `Бот ${botId}`;
  return channel.name || "Подключённый аккаунт";
}
