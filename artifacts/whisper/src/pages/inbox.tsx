import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  useGetInbox, useListMessages, useUpdateMessage, useDeleteMessage,
  getGetInboxQueryKey, getListMessagesQueryKey,
} from "@workspace/api-client-react";
import type { Message } from "@workspace/api-client-react";
import { Heart, Search, Trash2, PauseCircle, RotateCw, MailOpen } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { AppShell } from "@/components/app-shell";
import { ShareLink } from "@/components/share-link";
import { timeAgo } from "@/lib/utils-whisper";

type Filter = "all" | "unread" | "favorites";

export default function InboxPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const inbox = useGetInbox({ query: { queryKey: getGetInboxQueryKey(), refetchInterval: 15000 } });
  const messages = useListMessages({ query: { queryKey: getListMessagesQueryKey(), refetchInterval: 15000 } });
  const update = useUpdateMessage();
  const del = useDeleteMessage();
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<number | null>(null);
  const [confirm, setConfirm] = useState<Message | null>(null);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: getGetInboxQueryKey() });
    qc.invalidateQueries({ queryKey: getListMessagesQueryKey() });
  };

  const list = useMemo(() => {
    const all = messages.data ?? [];
    return all.filter((m) =>
      (filter === "all" || (filter === "unread" ? !m.isRead : m.isFavorite)) &&
      m.content.toLowerCase().includes(q.trim().toLowerCase()));
  }, [messages.data, filter, q]);

  const patch = (m: Message, data: { isRead?: boolean; isFavorite?: boolean }) =>
    update.mutate({ id: m.id, data }, {
      onSuccess: refresh,
      onError: () => toast({ title: "Couldn't update that note", variant: "destructive" }),
    });

  const open = (m: Message) => {
    setOpenId(openId === m.id ? null : m.id);
    if (!m.isRead) patch(m, { isRead: true });
  };

  const doDelete = () => {
    if (!confirm) return;
    del.mutate({ id: confirm.id }, {
      onSuccess: () => { refresh(); toast({ title: "Note deleted" }); },
      onError: () => toast({ title: "Couldn't delete that note", variant: "destructive" }),
    });
    setConfirm(null);
  };

  const ib = inbox.data;
  const counts: Record<Filter, number | undefined> = { all: ib?.total, unread: ib?.unread, favorites: ib?.favorites };

  return (
    <AppShell>
      <section className="rise grid md:grid-cols-[1fr_auto] gap-6 items-end mb-10">
        <div>
          {ib ? (
            <>
              <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Inbox of</p>
              <h1 className="display text-4xl md:text-5xl mt-1" data-testid="text-display-name">{ib.displayName}</h1>
              <div className="mt-4"><ShareLink handle={ib.handle} /></div>
            </>
          ) : inbox.isError ? (
            <p className="text-destructive">Couldn't load your inbox details.</p>
          ) : (
            <><Skeleton className="h-4 w-20" /><Skeleton className="h-12 w-64 mt-2" /><Skeleton className="h-9 w-80 mt-4 rounded-full" /></>
          )}
        </div>
        {ib && !ib.acceptingMessages && (
          <Link href="/settings" data-testid="link-paused" className="flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm">
            <PauseCircle className="h-4 w-4 text-primary" /> Inbox paused. Resume in settings
          </Link>
        )}
      </section>

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between mb-6">
        <div className="flex gap-1 p-1 rounded-full bg-muted w-fit">
          {(["all", "unread", "favorites"] as Filter[]).map((f) => (
            <button key={f} onClick={() => setFilter(f)} data-testid={`button-filter-${f}`}
              className={`px-4 py-1.5 rounded-full text-sm capitalize transition-all ${filter === f ? "bg-card shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
              {f} <span className="font-mono text-xs text-primary ml-1">{counts[f] ?? ""}</span>
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 rounded-full border bg-card px-4 py-2 focus-within:ring-2 ring-ring/40 sm:w-72">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search notes" data-testid="input-search"
            className="bg-transparent outline-none text-sm w-full" type="search" />
        </label>
      </div>

      {messages.isLoading ? (
        <div className="grid gap-4">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}</div>
      ) : messages.isError ? (
        <div className="note-card rounded-2xl p-10 text-center">
          <h3 className="display text-2xl">The notes didn't arrive.</h3>
          <p className="text-muted-foreground mt-2">Something went wrong loading your inbox.</p>
          <button onClick={() => messages.refetch()} data-testid="button-retry" className="mt-5 inline-flex items-center gap-2 rounded-full bg-secondary text-secondary-foreground px-5 py-2 text-sm">
            <RotateCw className="h-4 w-4" /> Try again
          </button>
        </div>
      ) : list.length === 0 ? (
        <div className="rounded-[2rem] border border-dashed p-12 text-center">
          <MailOpen className="h-8 w-8 mx-auto text-primary" />
          {(messages.data?.length ?? 0) === 0 ? (
            <>
              <h3 className="display text-3xl mt-4">Nothing here yet.</h3>
              <p className="text-muted-foreground mt-2 max-w-sm mx-auto">Notes appear the moment someone writes. Share your link to get the first one.</p>
              {ib && <div className="mt-6 flex justify-center"><ShareLink handle={ib.handle} /></div>}
            </>
          ) : (
            <>
              <h3 className="display text-2xl mt-4">No notes match.</h3>
              <p className="text-muted-foreground mt-2">Try another filter or search.</p>
            </>
          )}
        </div>
      ) : (
        <ul className="grid gap-4">
          {list.map((m, i) => {
            const expanded = openId === m.id;
            return (
              <li key={m.id} className="rise note-card rounded-2xl" style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }} data-testid={`card-message-${m.id}`}>
                <div className="flex gap-4 p-5">
                  <span className={`mt-2 h-2 w-2 rounded-full shrink-0 transition-opacity ${m.isRead ? "opacity-0" : "bg-primary"}`} />
                  <button onClick={() => open(m)} className="text-left flex-1 min-w-0" data-testid={`button-open-${m.id}`}>
                    <p className={`display text-lg leading-snug whitespace-pre-wrap break-words ${expanded ? "" : "line-clamp-2"} ${m.isRead ? "" : "font-semibold"}`}>{m.content}</p>
                    <p className="mt-2 font-mono text-[11px] text-muted-foreground">{timeAgo(m.createdAt)}{expanded ? "" : m.content.length > 140 ? "  ·  tap to read" : ""}</p>
                  </button>
                  <div className="flex flex-col gap-1">
                    <button onClick={() => patch(m, { isFavorite: !m.isFavorite })} data-testid={`button-favorite-${m.id}`}
                      aria-label="Favorite" className="p-2 rounded-full hover:bg-muted active:scale-75 transition-transform">
                      <Heart className={`h-4 w-4 transition-colors ${m.isFavorite ? "fill-primary text-primary" : "text-muted-foreground"}`} />
                    </button>
                    <button onClick={() => setConfirm(m)} data-testid={`button-delete-${m.id}`}
                      aria-label="Delete" className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                {expanded && m.isRead && (
                  <div className="px-5 pb-4 -mt-1 pl-11">
                    <button onClick={() => patch(m, { isRead: false })} className="text-xs text-muted-foreground hover:text-primary" data-testid={`button-unread-${m.id}`}>Mark as unread</button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <AlertDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="display text-2xl">Let this note go?</AlertDialogTitle>
            <AlertDialogDescription>It will be removed from your inbox permanently. There's no undo.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Keep it</AlertDialogCancel>
            <AlertDialogAction onClick={doDelete} className="bg-destructive text-destructive-foreground" data-testid="button-confirm-delete">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}
