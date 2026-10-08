import type { FormEvent } from "react";
import { useState } from "react";
import { useParams } from "wouter";
import { useGetPublicInbox, useSendMessage, getGetPublicInboxQueryKey } from "@workspace/api-client-react";
import { Send, PauseCircle, RotateCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Wordmark } from "@/components/brand";
import { errStatus } from "@/lib/utils-whisper";

const MAX = 1000;

export default function PublicProfile() {
  const { handle = "" } = useParams<{ handle: string }>();
  const pub = useGetPublicInbox(handle, { query: { enabled: !!handle, queryKey: getGetPublicInboxQueryKey(handle), retry: false } });
  const send = useSendMessage();
  const [content, setContent] = useState("");
  const [website, setWebsite] = useState("");
  const [sent, setSent] = useState(false);
  const [flying, setFlying] = useState(false);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    send.mutate({ handle, data: { content: content.trim(), website: website || undefined } }, {
      onSuccess: () => { setFlying(true); setTimeout(() => { setSent(true); setFlying(false); setContent(""); }, 650); },
      onError: (err) => { if (errStatus(err) === 403 || errStatus(err) === 409) pub.refetch(); },
    });
  };

  let body;
  if (pub.isLoading) {
    body = <div className="space-y-4"><Skeleton className="h-12 w-2/3" /><Skeleton className="h-5 w-full" /><Skeleton className="h-48 rounded-2xl mt-6" /></div>;
  } else if (pub.isError) {
    const nf = errStatus(pub.error) === 404;
    body = (
      <div className="text-center py-10">
        <h1 className="display text-4xl">{nf ? "No one by that name." : "This page didn't load."}</h1>
        <p className="text-muted-foreground mt-3">{nf ? `There's no inbox at /u/${handle}. Check the link with whoever shared it.` : "Something went wrong on our end."}</p>
        {!nf && <button onClick={() => pub.refetch()} data-testid="button-retry" className="mt-6 inline-flex items-center gap-2 rounded-full bg-secondary text-secondary-foreground px-5 py-2 text-sm"><RotateCw className="h-4 w-4" />Try again</button>}
      </div>
    );
  } else if (pub.data) {
    const p = pub.data;
    body = (
      <>
        <p className="rise font-mono text-xs uppercase tracking-widest text-primary">Write to</p>
        <h1 className="rise display text-5xl mt-2 break-words" data-testid="text-public-name">{p.displayName}</h1>
        {p.bio && <p className="rise mt-3 text-lg text-muted-foreground break-words" data-testid="text-public-bio">{p.bio}</p>}

        {!p.acceptingMessages ? (
          <div className="mt-10 rounded-2xl bg-accent p-8 text-center" data-testid="status-paused">
            <PauseCircle className="h-7 w-7 mx-auto text-primary" />
            <h2 className="display text-2xl mt-3">Inbox paused</h2>
            <p className="text-sm mt-1 opacity-75">{p.displayName} isn't taking notes right now. Check back later.</p>
          </div>
        ) : sent ? (
          <div className="rise mt-10 note-card rounded-2xl p-8 text-center" data-testid="status-sent">
            <h2 className="display text-3xl">Delivered.</h2>
            <p className="text-muted-foreground mt-2">Your note is in {p.displayName}'s inbox. Your name isn't shown with it.</p>
            <button onClick={() => setSent(false)} data-testid="button-send-another" className="mt-5 text-primary text-sm font-medium">Write another</button>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-10">
            <div className={`note-card rounded-2xl p-5 ${flying ? "fly" : ""}`}>
              <textarea value={content} onChange={(e) => setContent(e.target.value.slice(0, MAX))} rows={7} maxLength={MAX}
                placeholder="Say the honest thing, kindly." data-testid="input-message"
                className="w-full bg-transparent outline-none resize-none display text-lg leading-relaxed" />
              <div className="flex items-center justify-between border-t pt-3">
                <span className={`font-mono text-xs ${content.length > 900 ? "text-primary" : "text-muted-foreground"}`} data-testid="text-char-count">{content.length}/{MAX}</span>
                <button type="submit" disabled={!content.trim() || send.isPending || flying} data-testid="button-send"
                  className="flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-5 py-2.5 text-sm font-medium disabled:opacity-40 active:scale-95 transition-transform">
                  {send.isPending ? "Sending" : "Send"} <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
            <input type="text" name="website" value={website} onChange={(e) => setWebsite(e.target.value)} tabIndex={-1} autoComplete="off" aria-hidden className="absolute -left-[9999px] h-0 w-0 opacity-0" />
            {send.isError && <p className="mt-3 text-sm text-destructive" data-testid="text-send-error">{errStatus(send.error) === 429 ? "Too many messages. Please wait up to 10 minutes before sending another." : "That didn't send. Please try again in a moment."}</p>}
            <p className="mt-4 text-xs text-muted-foreground">No account needed. {p.displayName} sees your words and when they arrived, not your name. Avoid including details that identify you if you'd rather stay unnamed.</p>
          </form>
        )}
      </>
    );
  }

  return (
    <div className="min-h-[100dvh] flex flex-col">
      <header className="mx-auto w-full max-w-2xl px-5 h-20 flex items-center"><Wordmark /></header>
      <main className="mx-auto w-full max-w-2xl px-5 py-6 flex-1">{body}</main>
      <footer className="mx-auto max-w-2xl px-5 pb-8 text-xs text-muted-foreground">Want your own? Open whisper and make a page.</footer>
    </div>
  );
}
