"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Bell, CheckCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/actions/notifications";
import type { Notification } from "@/lib/database.types";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export function NotificationsBell({
  userId,
  initial,
}: {
  userId: string;
  initial: Notification[];
}) {
  const router = useRouter();
  const [items, setItems] = useState<Notification[]>(initial);
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();

  const unread = items.filter((n) => !n.read).length;

  // Realtime: nuevas notificaciones para mí, al instante.
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `recipient_id=eq.${userId}`,
        },
        (payload) => {
          const n = payload.new as Notification;
          setItems((prev) => [n, ...prev].slice(0, 30));
          router.refresh();
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, router]);

  function openItem(n: Notification) {
    setItems((prev) =>
      prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)),
    );
    startTransition(async () => {
      await markNotificationRead(n.id);
    });
    setOpen(false);
    if (n.href) router.push(n.href);
  }

  function markAll() {
    setItems((prev) => prev.map((x) => ({ ...x, read: true })));
    startTransition(async () => {
      await markAllNotificationsRead();
    });
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative rounded-full"
          aria-label={`Notificaciones${unread > 0 ? ` (${unread} sin leer)` : ""}`}
        >
          <Bell className="size-5" aria-hidden />
          {unread > 0 ? (
            <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-clay text-[10px] font-semibold text-clay-foreground">
              {unread > 9 ? "9+" : unread}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-4 py-2.5">
          <p className="font-display text-base">Notificaciones</p>
          {unread > 0 ? (
            <button
              type="button"
              onClick={markAll}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <CheckCheck className="size-3.5" aria-hidden />
              Marcar leídas
            </button>
          ) : null}
        </div>
        {items.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">
            Sin novedades por ahora 🎾
          </p>
        ) : (
          <ScrollArea className="max-h-80">
            <ul className="divide-y">
              {items.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => openItem(n)}
                    className={cn(
                      "flex w-full flex-col gap-0.5 px-4 py-3 text-left transition-colors hover:bg-accent",
                      !n.read && "bg-accent/50",
                    )}
                  >
                    <span className="flex items-center gap-2 text-sm font-medium">
                      {!n.read ? (
                        <span className="size-1.5 shrink-0 rounded-full bg-clay" aria-hidden />
                      ) : null}
                      {n.title}
                    </span>
                    {n.body ? (
                      <span className="line-clamp-2 text-sm text-muted-foreground">
                        {n.body}
                      </span>
                    ) : null}
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(n.created_at), {
                        addSuffix: true,
                        locale: es,
                      })}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </ScrollArea>
        )}
      </PopoverContent>
    </Popover>
  );
}
